/**
 * Aditi's 40th: backend running in YOUR Google account.
 * - Files go into a Drive folder (browsers upload straight to Drive via a resumable session).
 * - Names / notes / file links go into a Google Sheet.
 * Setup: see SETUP.md. Run setup() once, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone).
 */
const FOLDER_NAME = "Aditi 40th - Uploads";
const SHEET_NAME = "Aditi 40th - Contributions";

function setup() {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty("FOLDER_ID")) p.setProperty("FOLDER_ID", DriveApp.createFolder(FOLDER_NAME).getId());
  if (!p.getProperty("SHEET_ID")) {
    const ss = SpreadsheetApp.create(SHEET_NAME);
    ss.getSheets()[0].appendRow(["time", "name", "relation", "note", "photo_ids", "video_id"]);
    p.setProperty("SHEET_ID", ss.getId());
  }
  Logger.log("Folder: " + DriveApp.getFolderById(p.getProperty("FOLDER_ID")).getUrl());
  Logger.log("Sheet:  " + SpreadsheetApp.openById(p.getProperty("SHEET_ID")).getUrl());
}

const out = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const clip = (s, n) => String(s == null ? "" : s).slice(0, n);

function doGet(e) {
  if ((e.parameter || {}).action !== "list") return out({ ok: true });
  const sh = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("SHEET_ID")).getSheets()[0];
  const rows = sh.getDataRange().getValues().slice(1);
  return out({
    ok: true,
    items: rows.map(r => ({
      name: r[1], relation: r[2], note: r[3],
      photos: String(r[4] || "").split(",").filter(Boolean),
      video: r[5] || "",
    })),
  });
}

function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    if (b.action === "init") return out(initUpload(b));
    if (b.action === "finish") return out(finish(b));
    return out({ ok: false, error: "bad action" });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

/** Create a Drive resumable-upload session; the browser PUTs the file bytes straight to it. */
function initUpload(b) {
  const mime = clip(b.mimeType, 100).split(";")[0];
  if (!/^(image|video)\//.test(mime)) return { ok: false, error: "only images and videos" };
  const res = UrlFetchApp.fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id", {
    method: "post",
    contentType: "application/json; charset=UTF-8",
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken(),
      "X-Upload-Content-Type": mime,
      "X-Upload-Content-Length": String(Number(b.size) || 0),
      Origin: clip(b.origin, 200),
    },
    payload: JSON.stringify({ name: clip(b.name, 200), parents: [PropertiesService.getScriptProperties().getProperty("FOLDER_ID")] }),
    muteHttpExceptions: true,
  });
  const h = res.getAllHeaders();
  const url = h["Location"] || h["location"];
  if (!url) return { ok: false, error: "no session: " + res.getContentText().slice(0, 200) };
  return { ok: true, url: url };
}

/** After the uploads: make files viewable, then log the contribution in the sheet. */
function finish(b) {
  const p = PropertiesService.getScriptProperties();
  const folder = DriveApp.getFolderById(p.getProperty("FOLDER_ID"));
  const idOf = name => {
    const it = folder.getFilesByName(String(name));
    if (!it.hasNext()) throw new Error("file not found: " + name);
    const f = it.next();
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return f.getId();
  };
  const photos = (b.photoNames || []).slice(0, 40).map(idOf);
  const video = b.videoName ? idOf(b.videoName) : "";
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    SpreadsheetApp.openById(p.getProperty("SHEET_ID")).getSheets()[0]
      .appendRow([new Date(), clip(b.name, 60), clip(b.relation, 80), clip(b.note, 300), photos.join(","), video]);
  } finally { lock.releaseLock(); }
  return { ok: true };
}
