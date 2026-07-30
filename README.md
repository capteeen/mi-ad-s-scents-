# Mi'ad Scent

> Wear Confidence, Wear Mi'ad — luxury unisex fragrances from Maiduguri, Borno State.

Live site: **https://capteeen.github.io/mi-ad-s-scents-/** (GitHub Pages)

---

## Owner Dashboard

An admin dashboard is available at **`admin.html`** where you can add, edit, and remove products from the live catalogue. All changes sync in real time to every visitor.

---

## Firebase Setup (one-time, ~10 minutes)

The storefront and dashboard are powered by Firebase (Firestore + Auth + Storage). You need to create a free Firebase project once.

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `miad-scent`) → follow the wizard
3. Once created, click the **Web** icon (`</>`) to add a web app
4. Register the app (nickname: `miad-scent-web`) — **do NOT** check "Firebase Hosting"
5. Copy the `firebaseConfig` object that appears

### 2. Paste your config

Open `js/firebase-config.js` and replace the placeholder values:

```js
var FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",              // ← paste yours
  authDomain: "miad-scent.firebaseapp.com",
  projectId: "miad-scent",
  storageBucket: "miad-scent.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 3. Enable Authentication

1. In the Firebase console sidebar, go to **Build → Authentication**
2. Click **Get started**
3. Under **Sign-in providers**, click **Email/Password** → **Enable** → Save
4. Go to the **Users** tab → **Add user** → enter your email + password
   (This is how you'll sign into the admin dashboard.)

### 4. Create Firestore Database

1. In the sidebar, go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (or test mode — we'll lock it down with rules next)
4. Pick a location closest to you (e.g. `europe-west1` or `nam5`)

### 5. Set Firestore Security Rules

Go to the **Rules** tab in Firestore and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Click **Publish**.

### 6. Set up Storage

1. In the sidebar, go to **Build → Storage**
2. Click **Get started** → **Start in production mode**
3. Go to the **Rules** tab and paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Click **Publish**.

### 7. You're done!

Visit `admin.html` on your live site, sign in with your email + password, and start managing your catalogue.

---

## Project Structure

```
mi-ad-s-scents-/
├── index.html           ← Storefront (dynamically renders products)
├── admin.html           ← Owner dashboard (login, add/edit/delete)
├── js/
│   ├── firebase-config.js   ← Paste your Firebase credentials here
│   └── products.js          ← Data layer (Firestore + fallback defaults)
├── assets/                  ← Product images
└── README.md
```

## How It Works

- **Without Firebase:** `index.html` falls back to 5 default products defined in `js/products.js`. The site works immediately — no setup required.
- **With Firebase:** Both the storefront and dashboard read from Firestore. Changes you make in the dashboard appear on the website for all visitors.
- **Images:** You can upload images directly from the dashboard (stored in Firebase Storage) or paste an image URL (e.g. `assets/my-scent.jpeg`).
- **Ordering:** Customers build their order and are redirected to WhatsApp (0902 525 5787) with a pre-filled message.
