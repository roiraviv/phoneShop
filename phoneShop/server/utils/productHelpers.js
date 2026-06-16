/** שדות מחושבים למוצר – מחליף virtuals של Mongoose */

export function getProfitMarginPercent(buyPrice, sellPrice) {
  if (!buyPrice || buyPrice === 0) return 0;
  return Number((((sellPrice - buyPrice) / buyPrice) * 100).toFixed(2));
}

export function enrichProduct(product) {
  if (!product) return null;

  const profitMarginPercent = getProfitMarginPercent(
    product.buyPrice,
    product.sellPrice
  );

  return {
    ...product,
    _id: product.id,
    profitMarginPercent,
    unitProfit: Number((product.sellPrice - product.buyPrice).toFixed(2)),
    isLowStock:
      product.productType === 'accessory' &&
      product.stockQuantity <= product.lowStockThreshold,
  };
}

export function enrichRepair(repair) {
  if (!repair) return null;

  const profitMarginPercent =
    repair.finalCustomerPrice > 0
      ? Number(((repair.profit / repair.finalCustomerPrice) * 100).toFixed(2))
      : 0;

  return { ...repair, _id: repair.id, profitMarginPercent };
}

export function enrichCustomer(customer) {
  if (!customer) return null;

  const now = new Date();
  const activeWarrantyCount = (customer.warranties || []).filter(
    (w) => w.isActive && new Date(w.endDate) >= now
  ).length;

  return { ...customer, _id: customer.id, activeWarrantyCount };
}

export function enrichTransaction(transaction, customer = null) {
  if (!transaction) return null;

  return {
    ...transaction,
    _id: transaction.id,
    customer: customer ? enrichCustomer(customer) : transaction.customer,
  };
}
