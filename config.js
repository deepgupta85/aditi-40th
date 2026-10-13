// ✏️ EDIT THIS FILE FIRST
export const CONFIG = {
  herName: "Aditi",
  age: 40,

  // The moment the gallery unlocks for her (local time of the viewer)
  birthday: "2026-11-06T00:00:00",

  // Password Aditi types on the gallery page (works only after the birthday)
  giftPassword: "aditi40",
  // Password YOU use to preview the gallery any time before the birthday
  adminPassword: "preview-only-me",

  // Free Cloudinary account: photos and videos are uploaded here.
  // While cloudName is "YOUR_CLOUD_NAME" the site runs in DEMO MODE (nothing is uploaded).
  cloudinary: {
    cloudName: "YOUR_CLOUD_NAME",
    uploadPreset: "aditi40", // an UNSIGNED upload preset
  },

  // Firebase (free Firestore database only: names + notes + links to the media)
  firebase: {
    apiKey: "AIzaSyAPdD31wXXw5g4Kahd3tAs9iEA3f3WngnU",
    authDomain: "aditi40-bday-2026.firebaseapp.com",
    projectId: "aditi40-bday-2026",
    storageBucket: "aditi40-bday-2026.firebasestorage.app",
    messagingSenderId: "964409014728",
    appId: "1:964409014728:web:3fd0a47c78b16d74a368fd",
  },
};
