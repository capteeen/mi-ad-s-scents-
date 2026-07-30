const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

function loadProductStore() {
  const documents = new Map();
  let nextId = 1;

  function snapshot() {
    const docs = Array.from(documents, ([id, data]) => ({
      id,
      data: () => ({ ...data })
    }));
    return { empty: docs.length === 0, docs };
  }

  const collection = {
    add: async (data) => {
      const id = `generated-${documents.size + 1}`;
      documents.set(id, { ...data });
      return { id };
    },
    doc: (id) => {
      const docId = id || `generated-${nextId++}`;
      return {
        id: docId,
        delete: async () => documents.delete(docId),
        update: async (data) => {
          if (!documents.has(docId)) throw new Error(`No document to update: products/${docId}`);
          documents.set(docId, { ...documents.get(docId), ...data });
        }
      };
    },
    orderBy: () => ({ get: async () => snapshot() })
  };

  const db = {
    batch: () => {
      const writes = [];
      return {
        set: (ref, data) => writes.push([ref.id, { ...data }]),
        commit: async () => writes.forEach(([id, data]) => documents.set(id, data))
      };
    },
    collection: () => collection
  };

  const context = {
    console,
    firebaseIsConfigured: () => true,
    FIREBASE_CONFIG: {},
    firebase: {
      apps: [{}],
      firestore: () => db
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('js/products.js', 'utf8'), context);
  context.ProductStore.init();

  return { ProductStore: context.ProductStore, documents };
}

test('editing a fallback product persists all defaults before updating it', async () => {
  const { ProductStore, documents } = loadProductStore();

  await ProductStore.update('default-roseline', { name: 'Roseline Updated', sort: 1 });

  assert.equal(documents.size, 5);
  assert.equal(documents.get('default-roseline').name, 'Roseline Updated');
});

test('deleting a fallback product persists the other defaults', async () => {
  const { ProductStore, documents } = loadProductStore();

  await ProductStore.remove('default-roseline');

  assert.equal(documents.size, 4);
  assert.equal(documents.has('default-roseline'), false);
});

test('seeding defaults twice does not create duplicate products', async () => {
  const { ProductStore, documents } = loadProductStore();

  await ProductStore.seedDefaults();
  await ProductStore.seedDefaults();

  assert.equal(documents.size, 5);
});
