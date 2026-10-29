// ✏️ EDIT THIS FILE FIRST
export const CONFIG = {
  herName: "Aditi",
  age: 40,

  // The moment the gallery unlocks for her (local time of the viewer)
  birthday: "2026-11-06T00:00:00",

  // Password Aditi types on the gallery page (works only after the birthday)
  giftPassword: "aditi@40",
  // Password YOU use to preview the gallery any time before the birthday
  adminPassword: "preview-only-me",

  // Entries with these names are hidden from the gallery (test uploads)
  hiddenNames: ["Deep", "TEST (delete me)"],

  // The Google Apps Script web-app URL (see SETUP.md). Photos/videos go to your Google Drive.
  // While this is "YOUR_APPS_SCRIPT_URL" the site runs in DEMO MODE (nothing is uploaded).
  driveApi: "https://script.google.com/macros/s/AKfycbyRTRvf3wt76gVh4lRt4-URNmVn-hkZzU3uYdv82kCoNsxyv6gm7OGvlDhU6evH618A/exec",
};
