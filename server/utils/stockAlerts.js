import { getAllProducts } from '../storage/repositories/productRepository.js';

/**
 * שליפת מוצרים עם מלאי נמוך
 */
export async function getLowStockAlerts() {
  const products = await getAllProducts();

  const lowStockProducts = products
    .filter(
      (p) =>
        p.productType === 'accessory' &&
        p.isActive &&
        p.stockQuantity <= p.lowStockThreshold
    )
    .sort((a, b) => a.stockQuantity - b.stockQuantity);

  return lowStockProducts.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    category: product.category,
    stockQuantity: product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold,
    deficit: product.lowStockThreshold - product.stockQuantity,
    severity: product.stockQuantity === 0 ? 'קריטי' : 'אזהרה',
    message:
      product.stockQuantity === 0
        ? `${product.name} – אזל מהמלאי!`
        : `${product.name} – נותרו ${product.stockQuantity} יחידות (סף: ${product.lowStockThreshold})`,
  }));
}

export { findProductByScanCode } from '../storage/repositories/productRepository.js';
