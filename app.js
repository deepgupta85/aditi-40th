import { CONFIG } from "./config.js";

export const DEMO = CONFIG.driveApi === "YOUR_APPS_SCRIPT_URL";
export const MAX_VIDEO_MB = 500;

// ---------- backend (Google Apps Script: Drive + Sheet) ----------
async function api(body) {
  // text/plain keeps this a "simple" request (no CORS preflight)
  const r = await fetch(CONFIG.driveApi, { method: "POST", body: JSON.stringify(body) });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || "server error");
  return j;
}

async function uploadFile(file, onProgress) {
  const mime = (file.type || "application/octet-stream").split(";")[0];
  const name = crypto.randomUUID() + "_" + file.name.replace(/[^\w.\-]/g, "_");
  const { url } = await api({ action: "init", name, mimeType: mime, size: file.size, origin: location.origin });
  await new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("PUT", url);
    x.setRequestHeader("Content-Type", mime);
    x.upload.onprogress = e => e.lengthComputable && onProgress?.(e.loaded / e.total);
    x.onload = () => (x.status >= 200 && x.status < 300 ? resolve() : reject(new Error("upload " + x.status)));
    x.onerror = () => reject(new Error("network"));
    x.send(file);
  });
  return name;
}

/** Downscale big phone photos so uploads are fast. */
export async function shrinkImage(file, max = 2000) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, "image/jpeg", 0.85));
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch { return file; }
}

export async function submitContribution({ name, relation, note, photos, video }, onProgress) {
  if (DEMO) { // pretend
    for (let i = 1; i <= 10; i++) { await new Promise(r => setTimeout(r, 120)); onProgress(i / 10); }
    return;
  }
  const files = [...photos, ...(video ? [video] : [])];
  const done = new Array(files.length).fill(0);
  const report = () => onProgress((done.reduce((a, b) => a + b, 0) / Math.max(files.length, 1)) * 0.95);
  const names = await Promise.all(files.map((f, i) => uploadFile(f, p => { done[i] = p; report(); })));
  await api({
    action: "finish", name, relation, note,
    photoNames: names.slice(0, photos.length),
    videoName: video ? names[photos.length] : "",
  });
  onProgress(1);
}

// ---------- reading (gallery) ----------
const svg = (c1, c2, t) => "data:image/svg+xml," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='700'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='600' height='700' fill='url(#g)'/><text x='300' y='360' font-size='64' text-anchor='middle' fill='white' font-family='Georgia'>${t}</text></svg>`);

const driveImg = (id, w) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${w}`;

export async function loadContributions() {
  if (DEMO) {
    const sample = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"; // demo only
    return [
      { name: "Riya", relation: "Best friend since college", note: "40 looks fabulous on you! Remember our Goa trip? Never forget those sunsets.", photos: [svg("#f6a5a5", "#e86f8c", "Goa 2012"), svg("#a5c8f6", "#6f8ce8", "Us!")], video: sample },
      { name: "Mom", relation: "Mother", note: "My baby is 40! Always so proud of you, beta.", photos: [svg("#f6d9a5", "#e8a96f", "Childhood")], video: sample },
      { name: "Karan", relation: "Brother", note: "Happy birthday didi! Thanks for always covering for me.", photos: [svg("#b9f6a5", "#6fe89b", "Diwali"), svg("#d3a5f6", "#a96fe8", "Trip")], video: null },
    ];
  }
  const r = await fetch(`${CONFIG.driveApi}?action=list`);
  const j = await r.json();
  return (j.items || []).map(c => ({
    name: c.name, relation: c.relation, note: c.note,
    photos: c.photos.map(id => driveImg(id, 1600)),
    video: c.video ? `https://drive.google.com/file/d/${encodeURIComponent(c.video)}/preview` : null,
    videoThumb: c.video ? driveImg(c.video, 640) : null,
    drive: true,
  }));
}

// ---------- shared UI helpers ----------
export function countdown(target, el, onDone) {
  const t = new Date(target).getTime();
  const tick = () => {
    let s = Math.max(0, Math.floor((t - Date.now()) / 1000));
    if (s === 0) { onDone?.(); el.innerHTML = ""; return clearInterval(iv); }
    const parts = [["days", 86400], ["hours", 3600], ["mins", 60], ["secs", 1]].map(([l, n]) => {
      const v = Math.floor(s / n); s %= n;
      return `<div class="cd"><b>${String(v).padStart(2, "0")}</b><span>${l}</span></div>`;
    });
    el.innerHTML = parts.join("");
  };
  const iv = setInterval(tick, 1000); tick();
}

export function confetti(ms = 3500) {
  const c = document.createElement("canvas");
  Object.assign(c.style, { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99 });
  c.width = innerWidth; c.height = innerHeight;
  document.body.appendChild(c);
  const g = c.getContext("2d");
  const cols = ["#e86f8c", "#f2b134", "#5fb49c", "#6f8ce8", "#fff3d6"];
  const ps = Array.from({ length: 140 }, () => ({
    x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.5,
    r: 4 + Math.random() * 6, vx: -1.5 + Math.random() * 3, vy: 2 + Math.random() * 4,
    rot: Math.random() * 6, vr: -0.2 + Math.random() * 0.4, col: cols[Math.floor(Math.random() * cols.length)],
  }));
  const end = Date.now() + ms;
  (function frame() {
    g.clearRect(0, 0, c.width, c.height);
    ps.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
      g.fillStyle = p.col; g.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); g.restore();
    });
    if (Date.now() < end) requestAnimationFrame(frame); else c.remove();
  })();
}

export const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
