import { getAllTransactions } from '../storage/repositories/transactionRepository.js';
import { getExpensesInRange, sumExpensesInRange } from '../storage/repositories/expenseRepository.js';
import { getAllProducts } from '../storage/repositories/productRepository.js';
import { readCollection } from '../storage/jsonStore.js';
import { REPAIR_STATUS } from '../constants/index.js';

/**
 * שירות אנליטיקה – קורא מקבצי JSON, מייצר נתונים ל-Chart.js / Recharts
 */

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

function formatDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function aggregateTransactionsFromList(transactions) {
  return transactions.reduce(
    (acc, txn) => {
      acc.grossRevenue += txn.total;
      acc.totalCost += txn.totalCost;
      acc.totalProfit += txn.totalProfit;
      acc.transactionCount += 1;
      acc.phoneSales += txn.items.filter((i) => i.itemType === 'phone').length;
      acc.repairSales += txn.items.filter((i) => i.itemType === 'repair').length;
      return acc;
    },
    {
      grossRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      transactionCount: 0,
      phoneSales: 0,
      repairSales: 0,
    }
  );
}

export async function getFinancialSummary(startDate, endDate) {
  const transactions = await getAllTransactions({ startDate, endDate });
  const txnData = aggregateTransactionsFromList(transactions);
  const totalExpenses = await sumExpensesInRange(startDate, endDate);

  const grossRevenue = txnData.grossRevenue;
  const totalCost = txnData.totalCost;
  const grossProfit = txnData.totalProfit;
  const netProfit = Number((grossProfit - totalExpenses).toFixed(2));
  const profitMarginPercent =
    grossRevenue > 0
      ? Number(((netProfit / grossRevenue) * 100).toFixed(2))
      : 0;

  return {
    grossRevenue: Number(grossRevenue.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    totalExpenses: Number(totalExpenses.toFixed(2)),
    netProfit,
    profitMarginPercent,
    transactionCount: txnData.transactionCount,
    phoneSalesCount: txnData.phoneSales,
    repairSalesCount: txnData.repairSales,
  };
}

export async function getDailyProfitabilityChart(days = 30) {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const [transactions, expenses] = await Promise.all([
    getAllTransactions({ startDate, endDate }),
    getExpensesInRange(startDate, endDate),
  ]);

  const dailyMap = new Map();

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dailyMap.set(formatDateKey(d), {
      revenue: 0,
      profit: 0,
      cost: 0,
      expenses: 0,
    });
  }

  transactions.forEach((txn) => {
    const key = formatDateKey(txn.createdAt);
    if (dailyMap.has(key)) {
      const day = dailyMap.get(key);
      day.revenue += txn.total;
      day.profit += txn.totalProfit;
      day.cost += txn.totalCost;
    }
  });

  expenses.forEach((exp) => {
    const key = formatDateKey(exp.expenseDate);
    if (dailyMap.has(key)) {
      dailyMap.get(key).expenses += exp.amount;
    }
  });

  const labels = [];
  const revenueData = [];
  const profitData = [];
  const netProfitData = [];
  const costData = [];

  dailyMap.forEach((value, key) => {
    const date = new Date(key);
    labels.push(`${date.getDate()}/${date.getMonth() + 1}`);
    revenueData.push(Number(value.revenue.toFixed(2)));
    profitData.push(Number(value.profit.toFixed(2)));
    netProfitData.push(Number((value.profit - value.expenses).toFixed(2)));
    costData.push(Number((value.cost + value.expenses).toFixed(2)));
  });

  return {
    period: 'יומי',
    labels,
    datasets: [
      {
        label: 'הכנסות ברוטו (₪)',
        data: revenueData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
      },
      {
        label: 'רווח גולמי (₪)',
        data: profitData,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
      },
      {
        label: 'רווח נקי (₪)',
        data: netProfitData,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
      },
      {
        label: 'עלויות + הוצאות (₪)',
        data: costData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
      },
    ],
  };
}

export async function getWeeklyProfitabilityChart(weeks = 12) {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);
  startDate.setHours(0, 0, 0, 0);

  const [transactions, expenses] = await Promise.all([
    getAllTransactions({ startDate, endDate }),
    getExpensesInRange(startDate, endDate),
  ]);

  const weekMap = new Map();

  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const key = formatDateKey(getWeekStart(weekStart));
    weekMap.set(key, { revenue: 0, profit: 0, expenses: 0 });
  }

  transactions.forEach((txn) => {
    const key = formatDateKey(getWeekStart(txn.createdAt));
    if (weekMap.has(key)) {
      weekMap.get(key).revenue += txn.total;
      weekMap.get(key).profit += txn.totalProfit;
    }
  });

  expenses.forEach((exp) => {
    const key = formatDateKey(getWeekStart(exp.expenseDate));
    if (weekMap.has(key)) {
      weekMap.get(key).expenses += exp.amount;
    }
  });

  const labels = [];
  const revenueData = [];
  const netProfitData = [];

  weekMap.forEach((value, key) => {
    const date = new Date(key);
    labels.push(`שבוע ${date.getDate()}/${date.getMonth() + 1}`);
    revenueData.push(Number(value.revenue.toFixed(2)));
    netProfitData.push(Number((value.profit - value.expenses).toFixed(2)));
  });

  return {
    period: 'שבועי',
    labels,
    datasets: [
      {
        label: 'הכנסות שבועיות (₪)',
        data: revenueData,
        backgroundColor: '#3b82f6',
      },
      {
        label: 'רווח נקי שבועי (₪)',
        data: netProfitData,
        backgroundColor: '#22c55e',
      },
    ],
  };
}

export async function getMonthlyProfitabilityChart(months = 12) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - (months - 1));
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const [transactions, expenses] = await Promise.all([
    getAllTransactions({ startDate, endDate }),
    getExpensesInRange(startDate, endDate),
  ]);

  const monthMap = new Map();

  for (let i = 0; i < months; i++) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);
    monthMap.set(getMonthKey(d), {
      revenue: 0,
      profit: 0,
      expenses: 0,
      phones: 0,
      repairs: 0,
    });
  }

  transactions.forEach((txn) => {
    const key = getMonthKey(txn.createdAt);
    if (monthMap.has(key)) {
      const m = monthMap.get(key);
      m.revenue += txn.total;
      m.profit += txn.totalProfit;
      txn.items.forEach((item) => {
        if (item.itemType === 'phone') m.phones += item.quantity;
        if (item.itemType === 'repair') m.repairs += 1;
      });
    }
  });

  expenses.forEach((exp) => {
    const key = getMonthKey(exp.expenseDate);
    if (monthMap.has(key)) {
      monthMap.get(key).expenses += exp.amount;
    }
  });

  const labels = [];
  const revenueData = [];
  const netProfitData = [];
  const marginData = [];

  monthMap.forEach((value, key) => {
    const [year, month] = key.split('-');
    labels.push(`${HEBREW_MONTHS[Number(month) - 1]} ${year}`);
    revenueData.push(Number(value.revenue.toFixed(2)));
    const net = value.profit - value.expenses;
    netProfitData.push(Number(net.toFixed(2)));
    marginData.push(
      value.revenue > 0 ? Number(((net / value.revenue) * 100).toFixed(1)) : 0
    );
  });

  return {
    period: 'חודשי',
    labels,
    datasets: [
      {
        label: 'הכנסות חודשיות (₪)',
        data: revenueData,
        type: 'bar',
        backgroundColor: '#3b82f6',
        yAxisID: 'y',
      },
      {
        label: 'רווח נקי (₪)',
        data: netProfitData,
        type: 'bar',
        backgroundColor: '#22c55e',
        yAxisID: 'y',
      },
      {
        label: 'אחוז רווח (%)',
        data: marginData,
        type: 'line',
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        yAxisID: 'y1',
      },
    ],
  };
}

export async function getProfitBreakdown(startDate, endDate) {
  const transactions = await getAllTransactions({ startDate, endDate });

  const breakdown = {};

  transactions.forEach((txn) => {
    txn.items.forEach((item) => {
      if (!breakdown[item.itemType]) {
        breakdown[item.itemType] = { revenue: 0, profit: 0, count: 0 };
      }
      breakdown[item.itemType].revenue += item.lineRevenue;
      breakdown[item.itemType].profit += item.lineProfit;
      breakdown[item.itemType].count += item.quantity;
    });
  });

  const typeLabels = {
    phone: 'טלפונים',
    accessory: 'אביזרים',
    repair: 'תיקונים',
  };

  const entries = Object.entries(breakdown);

  return {
    labels: entries.map(([type]) => typeLabels[type] || type),
    datasets: [
      {
        label: 'רווח לפי קטגוריה (₪)',
        data: entries.map(([, v]) => Number(v.profit.toFixed(2))),
        backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b'],
      },
    ],
    details: entries.map(([type, v]) => ({
      category: typeLabels[type] || type,
      revenue: Number(v.revenue.toFixed(2)),
      profit: Number(v.profit.toFixed(2)),
      count: v.count,
    })),
  };
}

const ITEM_TYPE_LABELS = {
  phone: 'טלפון',
  accessory: 'אביזר',
  repair: 'תיקון',
};

function itemGroupKey(item) {
  return `${item.itemType}:${item.referenceId || item.name}`;
}

export async function getProductSalesReport(startDate, endDate, sortBy = 'quantity') {
  const [transactions, products] = await Promise.all([
    getAllTransactions({ startDate, endDate }),
    getAllProducts(),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const soldMap = new Map();

  transactions.forEach((txn) => {
    txn.items.forEach((item) => {
      const key = itemGroupKey(item);
      if (!soldMap.has(key)) {
        const product = item.referenceId ? productMap.get(item.referenceId) : null;
        soldMap.set(key, {
          referenceId: item.referenceId || null,
          name: item.name,
          itemType: item.itemType,
          itemTypeLabel: ITEM_TYPE_LABELS[item.itemType] || item.itemType,
          identifier: product?.imei || product?.sku || product?.barcode || item.imei || item.barcode || null,
          category: product?.category || product?.make || null,
          quantitySold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          transactionIds: new Set(),
          currentStock: product?.productType === 'accessory' ? product?.stockQuantity ?? null : null,
          stockStatus: product?.productType === 'phone' ? product?.stockStatus ?? null : null,
          inInventory: Boolean(product),
          catalogSellPrice: product?.sellPrice ?? null,
          catalogBuyPrice: product?.buyPrice ?? null,
        });
      }

      const row = soldMap.get(key);
      row.quantitySold += item.quantity || 1;
      row.revenue += item.lineRevenue || 0;
      row.cost += item.lineCost || 0;
      row.profit += item.lineProfit || 0;
      row.transactionIds.add(txn.id);
    });
  });

  const items = [...soldMap.values()].map((row) => {
    const revenue = Number(row.revenue.toFixed(2));
    const cost = Number(row.cost.toFixed(2));
    const profit = Number(row.profit.toFixed(2));
    const qty = row.quantitySold;
    return {
      referenceId: row.referenceId,
      name: row.name,
      itemType: row.itemType,
      itemTypeLabel: row.itemTypeLabel,
      identifier: row.identifier,
      category: row.category,
      quantitySold: qty,
      revenue,
      cost,
      profit,
      profitMarginPercent: revenue > 0 ? Number(((profit / revenue) * 100).toFixed(1)) : 0,
      avgUnitPrice: qty > 0 ? Number((revenue / qty).toFixed(2)) : 0,
      avgUnitCost: qty > 0 ? Number((cost / qty).toFixed(2)) : 0,
      saleCount: row.transactionIds.size,
      currentStock: row.currentStock,
      stockStatus: row.stockStatus,
      inInventory: row.inInventory,
      catalogSellPrice: row.catalogSellPrice,
      catalogBuyPrice: row.catalogBuyPrice,
    };
  });

  const sortFns = {
    quantity: (a, b) => b.quantitySold - a.quantitySold || b.profit - a.profit,
    revenue: (a, b) => b.revenue - a.revenue || b.quantitySold - a.quantitySold,
    profit: (a, b) => b.profit - a.profit || b.quantitySold - a.quantitySold,
  };
  items.sort(sortFns[sortBy] || sortFns.quantity);
  items.forEach((item, i) => {
    item.rank = i + 1;
  });

  const grossRevenue = items.reduce((s, i) => s + i.revenue, 0);
  const totalCost = items.reduce((s, i) => s + i.cost, 0);
  const totalProfit = items.reduce((s, i) => s + i.profit, 0);
  const totalQuantitySold = items.reduce((s, i) => s + i.quantitySold, 0);

  const soldProductIds = new Set(
    items.filter((i) => i.referenceId && i.itemType !== 'repair').map((i) => i.referenceId)
  );
  const unsoldInInventory = products
    .filter((p) => p.isActive && !soldProductIds.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name,
      itemType: p.productType,
      itemTypeLabel: ITEM_TYPE_LABELS[p.productType] || p.productType,
      identifier: p.imei || p.sku || p.barcode || null,
      category: p.category || p.make || null,
      currentStock: p.productType === 'accessory' ? p.stockQuantity : null,
      stockStatus: p.productType === 'phone' ? p.stockStatus : null,
      catalogSellPrice: p.sellPrice,
      catalogBuyPrice: p.buyPrice,
    }));

  return {
    period: { from: startDate, to: endDate },
    summary: {
      grossRevenue: Number(grossRevenue.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      totalProfit: Number(totalProfit.toFixed(2)),
      profitMarginPercent:
        grossRevenue > 0 ? Number(((totalProfit / grossRevenue) * 100).toFixed(1)) : 0,
      totalQuantitySold,
      uniqueItemsSold: items.length,
      transactionCount: transactions.length,
    },
    items,
    unsoldInInventory,
  };
}

export async function getYearEndInventoryReport(asOfDate = new Date()) {
  const [products, repairs, customers] = await Promise.all([
    getAllProducts(),
    readCollection('repairs'),
    readCollection('customers'),
  ]);

  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const activeProducts = products.filter((p) => p.isActive !== false);

  const phones = activeProducts
    .filter((p) => p.productType === 'phone' && p.stockStatus === 'במלאי')
    .map((p) => ({
      id: p.id,
      name: p.name,
      make: p.make,
      model: p.model,
      imei: p.imei,
      supplier: p.supplier || '',
      stockStatus: p.stockStatus,
      buyPrice: p.buyPrice,
      sellPrice: p.sellPrice,
      profit: Number((p.sellPrice - p.buyPrice).toFixed(2)),
      stockEnteredAt: p.stockEnteredAt || p.createdAt,
    }))
    .sort((a, b) => new Date(b.stockEnteredAt) - new Date(a.stockEnteredAt));

  const accessories = activeProducts
    .filter((p) => p.productType === 'accessory' && (p.stockQuantity ?? 0) > 0)
    .map((p) => {
      const qty = p.stockQuantity ?? 0;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku || '',
        barcode: p.barcode || '',
        category: p.category || '',
        stockQuantity: qty,
        buyPrice: p.buyPrice,
        sellPrice: p.sellPrice,
        lineBuyValue: Number((p.buyPrice * qty).toFixed(2)),
        lineSellValue: Number((p.sellPrice * qty).toFixed(2)),
        lineProfit: Number(((p.sellPrice - p.buyPrice) * qty).toFixed(2)),
      };
    })
    .sort((a, b) => a.category.localeCompare(b.category, 'he') || a.name.localeCompare(b.name, 'he'));

  const openRepairs = repairs
    .filter((r) => r.status !== REPAIR_STATUS.DELIVERED && r.status !== REPAIR_STATUS.CANCELLED)
    .map((r) => {
      const customer = customerMap.get(r.customer);
      return {
        id: r.id,
        ticketNumber: r.ticketNumber,
        deviceModel: r.deviceModel,
        customerName: customer?.fullName || '—',
        status: r.status,
        finalCustomerPrice: r.finalCustomerPrice,
        partCost: r.partCost,
        receivedAt: r.receivedAt,
      };
    })
    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));

  const phoneBuyValue = phones.reduce((s, p) => s + p.buyPrice, 0);
  const phoneSellValue = phones.reduce((s, p) => s + p.sellPrice, 0);
  const accessoryBuyValue = accessories.reduce((s, p) => s + p.lineBuyValue, 0);
  const accessorySellValue = accessories.reduce((s, p) => s + p.lineSellValue, 0);
  const accessoryUnits = accessories.reduce((s, p) => s + p.stockQuantity, 0);

  return {
    asOfDate: asOfDate.toISOString(),
    year: asOfDate.getFullYear(),
    summary: {
      phoneCount: phones.length,
      phoneBuyValue: Number(phoneBuyValue.toFixed(2)),
      phoneSellValue: Number(phoneSellValue.toFixed(2)),
      phonePotentialProfit: Number((phoneSellValue - phoneBuyValue).toFixed(2)),
      accessorySkuCount: accessories.length,
      accessoryUnits,
      accessoryBuyValue: Number(accessoryBuyValue.toFixed(2)),
      accessorySellValue: Number(accessorySellValue.toFixed(2)),
      accessoryPotentialProfit: Number((accessorySellValue - accessoryBuyValue).toFixed(2)),
      totalBuyValue: Number((phoneBuyValue + accessoryBuyValue).toFixed(2)),
      totalSellValue: Number((phoneSellValue + accessorySellValue).toFixed(2)),
      totalPotentialProfit: Number(
        (phoneSellValue + accessorySellValue - phoneBuyValue - accessoryBuyValue).toFixed(2)
      ),
      openRepairsCount: openRepairs.length,
      readyForPickupCount: openRepairs.filter((r) => r.status === REPAIR_STATUS.FIXED).length,
    },
    phones,
    accessories,
    openRepairs,
  };
}

export async function getFullDashboard() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [today, thisMonth, daily, weekly, monthly, breakdown] =
    await Promise.all([
      getFinancialSummary(startOfDay, new Date()),
      getFinancialSummary(startOfMonth, new Date()),
      getDailyProfitabilityChart(30),
      getWeeklyProfitabilityChart(12),
      getMonthlyProfitabilityChart(12),
      getProfitBreakdown(startOfMonth, new Date()),
    ]);

  return {
    summary: { today, thisMonth },
    charts: { daily, weekly, monthly, breakdown },
  };
}
