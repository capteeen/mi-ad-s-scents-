/* ============================================================
   Product data layer — Mi'ad Scent
   ------------------------------------------------------------
   ProductStore is the single source of truth for products on
   both the storefront (index.html) and the owner dashboard
   (admin.html).

   - When Firebase is configured (js/firebase-config.js) it
     reads/writes the "products" collection in Firestore, so
     every visitor sees the same live catalogue.
   - When Firebase is NOT configured (or is unreachable) the
     storefront falls back to DEFAULT_PRODUCTS below, so the
     site always works.

   Product shape:
   {
     id:    string  (Firestore doc id, or "default-<slug>")
     name:  string  e.g. "Roseline"
     badge: string  e.g. "30ml" / "Body Spray"   (card corner pill)
     size:  string  e.g. "30ml" (optional, shown in order panel)
     type:  string  e.g. "Perfume Oil"
     mood:  string  e.g. "Soft · Elegant · Romantic"
     desc:  string
     image: string  (URL or assets/ path)
     sort:  number  (display order, lower first)
   }
   ============================================================ */

var DEFAULT_PRODUCTS = [
  {
    id: "default-roseline",
    name: "Roseline",
    badge: "30ml",
    size: "30ml",
    type: "Perfume Oil",
    mood: "Soft · Elegant · Romantic",
    desc: "A soft, elegant and romantic scent that leaves a lasting impression. Perfect for those who love subtle sweetness and class.",
    image: "assets/roseline.jpeg",
    sort: 1
  },
  {
    id: "default-velvet",
    name: "Velvet",
    badge: "30ml",
    size: "30ml",
    type: "Perfume Oil",
    mood: "Smooth · Rich · Warm",
    desc: "Smooth, rich and warm. Velvet is made for bold souls who love to stand out.",
    image: "assets/velvet.jpeg",
    sort: 2
  },
  {
    id: "default-afiya",
    name: "Afiya",
    badge: "10ml",
    size: "10ml",
    type: "Perfume Oil",
    mood: "Fresh · Clean · Uplifting",
    desc: "Fresh, clean and uplifting. Afiya brings peace, positivity and a touch of everyday luxury.",
    image: "assets/afiya.jpeg",
    sort: 3
  },
  {
    id: "default-desire",
    name: "Desire",
    badge: "Perfume Oil",
    size: "",
    type: "Perfume Oil",
    mood: "Deep · Mysterious · Addictive",
    desc: "Deep, mysterious and addictive. Desire is for those who want to leave a mark wherever they go.",
    image: "assets/desire.jpeg",
    sort: 4
  },
  {
    id: "default-kabbasa",
    name: "Kabbasa Spray",
    badge: "Body Spray",
    size: "",
    type: "Body Spray",
    mood: "Bold · Refreshing · Everyday",
    desc: "Our signature fragrance mist. Kabbasa keeps you fresh, bold and confident all day — wherever the day takes you.",
    image: "assets/kabbasa.jpeg",
    sort: 5
  }
];

var ProductStore = (function () {
  var COLLECTION = "products";
  var _db = null;
  var _storage = null;
  var _ready = false;

  /* True when Firebase SDK + config are present and initialised. */
  function isLive() {
    return _ready && _db !== null;
  }

  /* Initialise Firebase if configured. Safe to call once per page. */
  function init() {
    if (_ready) return isLive();
    _ready = true;
    try {
      if (typeof firebaseIsConfigured === "function" && firebaseIsConfigured() &&
          typeof firebase !== "undefined") {
        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        _db = firebase.firestore();
        if (firebase.storage) _storage = firebase.storage();
      }
    } catch (err) {
      console.warn("ProductStore: Firebase init failed, using defaults.", err);
      _db = null;
      _storage = null;
    }
    return isLive();
  }

  function bySort(a, b) {
    return (a.sort || 0) - (b.sort || 0);
  }

  /* Fetch all products. Falls back to DEFAULT_PRODUCTS. */
  async function getAll() {
    if (!init()) return DEFAULT_PRODUCTS.slice().sort(bySort);
    var snap = await _db.collection(COLLECTION).orderBy("sort").get();
    if (snap.empty) return DEFAULT_PRODUCTS.slice().sort(bySort);
    return snap.docs.map(function (doc) {
      var d = doc.data();
      d.id = doc.id;
      return d;
    }).sort(bySort);
  }

  /* Create a product. Returns the new doc id. */
  async function create(data) {
    if (!isLive()) throw new Error("Firebase is not configured.");
    data.sort = typeof data.sort === "number" ? data.sort : Date.now();
    var ref = await _db.collection(COLLECTION).add(data);
    return ref.id;
  }

  /* Persist fallback products before the first edit/delete operation. */
  async function persistDefaultsIfEmpty() {
    var collection = _db.collection(COLLECTION);
    var snap = await collection.orderBy("sort").get();
    if (!snap.empty) return;

    var batch = _db.batch();
    DEFAULT_PRODUCTS.forEach(function (p) {
      var data = Object.assign({}, p);
      delete data.id;
      batch.set(collection.doc(p.id), data);
    });
    await batch.commit();
  }

  /* Update an existing product by id. */
  async function update(id, data) {
    if (!isLive()) throw new Error("Firebase is not configured.");
    await persistDefaultsIfEmpty();
    delete data.id;
    await _db.collection(COLLECTION).doc(id).update(data);
  }

  /* Delete a product by id. */
  async function remove(id) {
    if (!isLive()) throw new Error("Firebase is not configured.");
    await persistDefaultsIfEmpty();
    await _db.collection(COLLECTION).doc(id).delete();
  }

  /* Upload an image file to Firebase Storage. Returns download URL. */
  async function uploadImage(file) {
    if (!isLive() || !_storage) throw new Error("Firebase Storage is not configured.");
    var safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    var path = "products/" + Date.now() + "-" + safeName;
    var snap = await _storage.ref(path).put(file);
    return await snap.ref.getDownloadURL();
  }

  /* Seed Firestore with DEFAULT_PRODUCTS (used once from the dashboard). */
  async function seedDefaults() {
    if (!isLive()) throw new Error("Firebase is not configured.");
    var batch = _db.batch();
    DEFAULT_PRODUCTS.forEach(function (p) {
      var data = Object.assign({}, p);
      delete data.id;
      var ref = _db.collection(COLLECTION).doc(p.id);
      batch.set(ref, data);
    });
    await batch.commit();
  }

  return {
    init: init,
    isLive: isLive,
    getAll: getAll,
    create: create,
    update: update,
    remove: remove,
    uploadImage: uploadImage,
    seedDefaults: seedDefaults
  };
})();
