import { readCollection, writeCollection, runAtomic, generateId, nowISO } from '../jsonStore.js';
import { enrichProduct, normalizePhoneInventoryFields } from '../../utils/productHelpers.js';

export async function getAllProducts() {
  const products = await readCollection('products');
  return products.map(enrichProduct);
}

export async function findProductById(id) {
  const products = await readCollection('products');
  return enrichProduct(products.find((p) => p.id === id) || null);
}

export async function findProductByScanCode(scanCode) {
  const code = scanCode.trim();
  const products = await readCollection('products');
  const product = products.find(
    (p) =>
      p.isActive &&
      (p.barcode === code || p.sku === code || p.imei === code)
  );
  return enrichProduct(product || null);
}

export async function saveProduct(productData) {
  return runAtomic(async () => {
    const products = await readCollection('products');
    const index = products.findIndex((p) => p.id === productData.id);

    if (index >= 0) {
      products[index] = {
        ...products[index],
        ...productData,
        updatedAt: nowISO(),
      };
      await writeCollection('products', products);
      return enrichProduct(products[index]);
    }

    const newProduct = normalizePhoneInventoryFields(
      {
        ...productData,
        id: generateId(),
        isActive: productData.isActive ?? true,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
      { isNew: true }
    );
    products.push(newProduct);
    await writeCollection('products', products);
    return enrichProduct(newProduct);
  });
}

export async function updateProduct(id, updates) {
  return runAtomic(async () => {
    const products = await readCollection('products');
    const index = products.findIndex((p) => p.id === id);
    if (index < 0) return null;

    products[index] = { ...products[index], ...updates, updatedAt: nowISO() };
    await writeCollection('products', products);
    return enrichProduct(products[index]);
  });
}
