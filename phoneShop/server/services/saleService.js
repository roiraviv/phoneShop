import crypto from 'crypto';
import { runAtomic, readCollection, writeCollection, nowISO } from '../storage/jsonStore.js';
import { findProductByScanCode } from '../storage/repositories/productRepository.js';
import { findRepairById } from '../storage/repositories/repairRepository.js';
import { PHONE_STOCK_STATUS, REPAIR_STATUS, PAYMENT_METHODS } from '../constants/index.js';
import {
  buildProductLineItem,
  buildRepairLineItem,
  calculateTransactionTotals,
} from '../utils/profitCalculator.js';
import { enrichTransaction } from '../utils/productHelpers.js';

/**
 * ביצוע עסקת מכירה אטומית – כל השינויים נשמרים לקבצי JSON בפעולה אחת
 */
export async function processSale({
  customerId,
  items: rawItems,
  discount = 0,
  paymentMethod = PAYMENT_METHODS.CASH,
  scannedViaBarcode = false,
  warrantyMonths = 12,
  notes,
  cashierName,
}) {
  if (!rawItems?.length) {
    throw new Error('יש לכלול לפחות פריט אחד בעסקה');
  }

  return runAtomic(async () => {
    const products = await readCollection('products');
    const repairs = await readCollection('repairs');
    const customers = await readCollection('customers');
    const transactions = await readCollection('transactions');

    const lineItems = [];
    const productUpdates = new Map();
    const repairUpdates = new Map();

    for (const raw of rawItems) {
      let product;
      let lineItem;

      if (raw.type === 'scan') {
        product = products.find(
          (p) =>
            p.isActive &&
            (p.barcode === raw.code.trim() ||
              p.sku === raw.code.trim() ||
              p.imei === raw.code.trim())
        );
        if (!product) throw new Error(`מוצר לא נמצא עבור קוד: ${raw.code}`);
        lineItem = buildProductLineItem(product, raw.quantity || 1, raw.code);
        applyStockChange(product, raw.quantity || 1, productUpdates);
      } else if (raw.type === 'product') {
        product = products.find((p) => p.id === raw.productId);
        if (!product || !product.isActive) {
          throw new Error(`מוצר לא נמצא: ${raw.productId}`);
        }
        lineItem = buildProductLineItem(product, raw.quantity || 1);
        applyStockChange(product, raw.quantity || 1, productUpdates);
      } else if (raw.type === 'repair') {
        const repair = repairs.find((r) => r.id === raw.repairId);
        if (!repair) throw new Error(`כרטיס תיקון לא נמצא: ${raw.repairId}`);
        if (repair.status === REPAIR_STATUS.DELIVERED) {
          throw new Error(`תיקון ${repair.ticketNumber} כבר נמסר ושולם`);
        }
        lineItem = buildRepairLineItem(repair);
        repairUpdates.set(repair.id, {
          status: REPAIR_STATUS.DELIVERED,
          deliveredAt: nowISO(),
        });
      } else {
        throw new Error(`סוג פריט לא מוכר: ${raw.type}`);
      }

      lineItems.push(lineItem);
    }

    const totals = calculateTransactionTotals(lineItems, discount);
    const count = transactions.length;

    const transaction = {
      id: crypto.randomUUID(),
      transactionNumber: `TXN-${String(count + 1).padStart(6, '0')}`,
      customer: customerId || null,
      items: lineItems,
      subtotal: totals.subtotal,
      discount,
      total: totals.total,
      totalCost: totals.totalCost,
      totalProfit: totals.totalProfit,
      profitMarginPercent: totals.profitMarginPercent,
      paymentMethod,
      scannedViaBarcode,
      notes,
      cashierName,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    transactions.push(transaction);

    productUpdates.forEach((updates, id) => {
      const idx = products.findIndex((p) => p.id === id);
      if (idx >= 0) {
        products[idx] = { ...products[idx], ...updates, updatedAt: nowISO() };
      }
    });

    repairUpdates.forEach((updates, id) => {
      const idx = repairs.findIndex((r) => r.id === id);
      if (idx >= 0) {
        repairs[idx] = {
          ...repairs[idx],
          ...updates,
          transaction: transaction.id,
          updatedAt: nowISO(),
        };
      }
    });

    if (customerId) {
      const customerIdx = customers.findIndex((c) => c.id === customerId);
      if (customerIdx >= 0) {
        const customer = customers[customerIdx];
        customer.purchaseHistory = customer.purchaseHistory || [];
        customer.purchaseHistory.push(transaction.id);

        const repairIds = lineItems
          .filter((item) => item.itemType === 'repair')
          .map((item) => item.referenceId);

        customer.repairHistory = customer.repairHistory || [];
        repairIds.forEach((id) => {
          if (!customer.repairHistory.includes(id)) {
            customer.repairHistory.push(id);
          }
        });

        const phoneItems = lineItems.filter((item) => item.itemType === 'phone');
        customer.warranties = customer.warranties || [];
        phoneItems.forEach((phone) => {
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + warrantyMonths);
          customer.warranties.push({
            id: crypto.randomUUID(),
            imei: phone.imei,
            product: phone.referenceId,
            transaction: transaction.id,
            startDate: nowISO(),
            endDate: endDate.toISOString(),
            coverage: `אחריות חנות ${warrantyMonths} חודשים`,
            isActive: true,
          });
        });

        customer.updatedAt = nowISO();
        customers[customerIdx] = customer;
      }
    }

    await writeCollection('products', products);
    await writeCollection('repairs', repairs);
    await writeCollection('customers', customers);
    await writeCollection('transactions', transactions);

    const customer = customerId
      ? customers.find((c) => c.id === customerId)
      : null;

    return enrichTransaction(transaction, customer);
  });
}

function applyStockChange(product, quantity, productUpdates) {
  if (product.productType === 'phone') {
    if (product.stockStatus !== PHONE_STOCK_STATUS.IN_STOCK) {
      throw new Error(`טלפון ${product.imei} אינו זמין למכירה`);
    }
    productUpdates.set(product.id, { stockStatus: PHONE_STOCK_STATUS.SOLD });
  } else {
    const existing = productUpdates.get(product.id);
    const currentQty = existing?.stockQuantity ?? product.stockQuantity;
    if (currentQty < quantity) {
      throw new Error(
        `${product.name} – מלאי לא מספיק (זמין: ${currentQty}, מבוקש: ${quantity})`
      );
    }
    productUpdates.set(product.id, { stockQuantity: currentQty - quantity });
  }
}

export { findProductByScanCode, findRepairById };
