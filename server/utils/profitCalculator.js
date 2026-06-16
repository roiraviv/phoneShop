/**
 * כלי עזר לחישוב רווחיות – משותף ל-POS ולדשבורד
 */

/** חישוב רווח שורה בודדת */
export function calculateLineProfit(quantity, unitSellPrice, unitBuyPrice) {
  const lineRevenue = Number((quantity * unitSellPrice).toFixed(2));
  const lineCost = Number((quantity * unitBuyPrice).toFixed(2));
  const lineProfit = Number((lineRevenue - lineCost).toFixed(2));

  return { lineRevenue, lineCost, lineProfit };
}

/** חישוב סיכומי עסקה */
export function calculateTransactionTotals(items, discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.lineRevenue, 0);
  const totalCost = items.reduce((sum, item) => sum + item.lineCost, 0);
  const total = Number(Math.max(0, subtotal - discount).toFixed(2));
  const totalProfit = Number((subtotal - discount - totalCost).toFixed(2));
  const profitMarginPercent =
    total > 0 ? Number(((totalProfit / total) * 100).toFixed(2)) : 0;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    total,
    totalProfit,
    profitMarginPercent,
  };
}

/** חישוב רווח תיקון: מחיר סופי פחות עלות חלקים */
export function calculateRepairProfit(finalCustomerPrice, partCost) {
  return Number((finalCustomerPrice - partCost).toFixed(2));
}

/** בניית פריט עסקה ממוצר (טלפון/אביזר) */
export function buildProductLineItem(product, quantity = 1, barcode = null) {
  const { lineRevenue, lineCost, lineProfit } = calculateLineProfit(
    quantity,
    product.sellPrice,
    product.buyPrice
  );

  return {
    itemType: product.productType,
    referenceId: product.id || product._id,
    referenceModel: 'Product',
    name: product.name,
    quantity,
    unitSellPrice: product.sellPrice,
    unitBuyPrice: product.buyPrice,
    imei: product.productType === 'phone' ? product.imei : undefined,
    barcode: barcode || product.barcode || product.sku || product.imei,
    lineRevenue,
    lineCost,
    lineProfit,
  };
}

/** בניית פריט עסקה מתיקון */
export function buildRepairLineItem(repair) {
  const lineRevenue = repair.finalCustomerPrice;
  const lineCost = repair.partCost;
  const lineProfit = repair.profit;

  return {
    itemType: 'repair',
    referenceId: repair.id || repair._id,
    referenceModel: 'Repair',
    name: `תיקון ${repair.deviceModel} – ${repair.ticketNumber}`,
    quantity: 1,
    unitSellPrice: repair.finalCustomerPrice,
    unitBuyPrice: repair.partCost,
    lineRevenue,
    lineCost,
    lineProfit,
  };
}
