/* ============================================================
   Firebase configuration — Mi'ad Scent
   ------------------------------------------------------------
   1. Go to https://console.firebase.google.com and create a
      project (e.g. "miad-scent").
   2. Add a Web App (</> icon) and copy the config object here,
      replacing every "PASTE_..." value below.
   3. In the Firebase console enable:
        - Authentication  → Sign-in method → Email/Password
          (then add your owner email + password under Users)
        - Firestore Database → Create database (production mode)
        - Storage → Get started
   4. Paste the security rules from README.md into Firestore
      and Storage rules tabs.
   Until this file is filled in, the website runs on the
   built-in default products and the dashboard stays locked.
   ============================================================ */

var FIREBASE_CONFIG = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};

/* Returns true only when every value has been replaced. */
function firebaseIsConfigured() {
  if (typeof FIREBASE_CONFIG !== "object" || FIREBASE_CONFIG === null) return false;
  return Object.keys(FIREBASE_CONFIG).every(function (key) {
    var v = FIREBASE_CONFIG[key];
    return typeof v === "string" && v.length > 0 && v.indexOf("PASTE_") !== 0;
  });
}
