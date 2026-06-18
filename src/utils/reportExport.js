import { formatCurrency, formatDate, formatDateHe } from './format';

function escapeCsv(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** ייצוא עסקאות ל-CSV */
export function exportTransactionsCsv(transactions) {
  const headers = ['תאריך', 'מספר עסקה', 'פריט', 'לקוח', 'סכום', 'רווח'];
  const rows = transactions.map((txn) => [
    formatDate(txn.createdAt),
    txn.transactionNumber,
    txn.items?.map((i) => i.name).join(' | ') || '',
    txn.customer?.fullName || 'לקוח מזדמן',
    txn.total,
    txn.totalProfit,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(`transactions-${date}.csv`, csv, 'text/csv;charset=utf-8');
}

/** ייצוא דוח מכירות לפי פריט (CSV – נפתח ב-Excel) */
export function exportSalesReportCsv(report) {
  const { period, summary, items } = report;
  const from = period?.from ? formatDateHe(period.from) : '';
  const to = period?.to ? formatDateHe(period.to) : '';

  const meta = [
    ['דוח מכירות לפי פריט'],
    [`תקופה: ${from} – ${to}`],
    [`סה"כ הכנסות: ${summary?.grossRevenue ?? 0}`],
    [`סה"כ רווח: ${summary?.totalProfit ?? 0}`],
    [`יחידות שנמכרו: ${summary?.totalQuantitySold ?? 0}`],
    [],
  ];

  const headers = [
    'דירוג',
    'שם פריט',
    'סוג',
    'מזהה (IMEI/SKU)',
    'קטגוריה',
    'כמות שנמכרה',
    'הכנסות (₪)',
    'עלות (₪)',
    'רווח (₪)',
    'מרווח (%)',
    'מחיר ממוצע',
    'מלאי נוכחי',
    'סטטוס מלאי',
  ];

  const rows = (items || []).map((item) => [
    item.rank,
    item.name,
    item.itemTypeLabel,
    item.identifier || '',
    item.category || '',
    item.quantitySold,
    item.revenue,
    item.cost,
    item.profit,
    item.profitMarginPercent,
    item.avgUnitPrice,
    item.currentStock ?? '',
    item.stockStatus || (item.inInventory ? 'במלאי' : ''),
  ]);

  const csv = [...meta, headers, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');

  const date = new Date().toISOString().slice(0, 10);
  downloadFile(`sales-report-${date}.csv`, csv, 'text/csv;charset=utf-8');
}

/** דוח מכירות לפי פריט – PDF (הדפסה) */
export function printSalesReport(report) {
  const { period, summary, items, unsoldInInventory } = report;
  const from = period?.from ? formatDateHe(period.from) : '—';
  const to = period?.to ? formatDateHe(period.to) : '—';

  const itemRows = (items || [])
    .map(
      (item) => `
      <tr>
        <td>${item.rank}</td>
        <td>${item.name}</td>
        <td>${item.itemTypeLabel}</td>
        <td>${item.identifier || '—'}</td>
        <td>${item.quantitySold}</td>
        <td>${formatCurrency(item.revenue)}</td>
        <td>${formatCurrency(item.profit)}</td>
        <td>${item.profitMarginPercent}%</td>
        <td>${item.currentStock ?? item.stockStatus ?? '—'}</td>
      </tr>`
    )
    .join('');

  const unsoldRows = (unsoldInInventory || [])
    .slice(0, 20)
    .map(
      (p) => `
      <tr>
        <td>${p.name}</td>
        <td>${p.itemTypeLabel}</td>
        <td>${p.identifier || '—'}</td>
        <td>${p.currentStock ?? p.stockStatus ?? '—'}</td>
        <td>${formatCurrency(p.catalogSellPrice)}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8" />
  <title>דוח מכירות לפי פריט</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .meta { color: #555; margin-bottom: 20px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi { border: 1px solid #ddd; padding: 12px; border-radius: 8px; }
    .kpi label { display: block; font-size: 12px; color: #666; }
    .kpi strong { font-size: 18px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 12px; }
    th { background: #f5f5f5; }
    h2 { font-size: 16px; margin: 16px 0 8px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>דוח מכירות לפי פריט</h1>
  <div class="meta">תקופה: ${from} – ${to} | נוצר: ${new Date().toLocaleString('he-IL')}</div>

  <div class="kpis">
    <div class="kpi"><label>הכנסות</label><strong>${formatCurrency(summary?.grossRevenue)}</strong></div>
    <div class="kpi"><label>רווח</label><strong>${formatCurrency(summary?.totalProfit)}</strong></div>
    <div class="kpi"><label>יחידות שנמכרו</label><strong>${summary?.totalQuantitySold ?? 0}</strong></div>
    <div class="kpi"><label>פריטים ייחודיים</label><strong>${summary?.uniqueItemsSold ?? 0}</strong></div>
  </div>

  <h2>מכירות לפי פריט (מהנמכר ביותר)</h2>
  <table>
    <thead>
      <tr>
        <th>#</th><th>פריט</th><th>סוג</th><th>מזהה</th>
        <th>כמות</th><th>הכנסות</th><th>רווח</th><th>מרווח</th><th>מלאי</th>
      </tr>
    </thead>
    <tbody>${itemRows || '<tr><td colspan="9">אין מכירות בתקופה</td></tr>'}</tbody>
  </table>

  ${unsoldInInventory?.length ? `
  <h2>פריטים במלאי ללא מכירות בתקופה (20 ראשונים)</h2>
  <table>
    <thead><tr><th>פריט</th><th>סוג</th><th>מזהה</th><th>מלאי</th><th>מחיר מחירון</th></tr></thead>
    <tbody>${unsoldRows}</tbody>
  </table>` : ''}

  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('לא ניתן לפתוח חלון הדפסה.');
    return;
  }
  win.document.write(html);
  win.document.close();
}

/** ייצוא דוח מלאי סוף שנה (CSV) */
export function exportInventoryReportCsv(report) {
  const { year, asOfDate, summary, phones, accessories, openRepairs } = report;
  const asOf = formatDateHe(asOfDate);

  const meta = [
    [`דוח מלאי סוף שנה ${year}`],
    [`נכון לתאריך: ${asOf}`],
    [`טלפונים במלאי: ${summary?.phoneCount ?? 0}`],
    [`אביזרים (יחידות): ${summary?.accessoryUnits ?? 0}`],
    [`שווי קנייה כולל: ${summary?.totalBuyValue ?? 0}`],
    [`שווי מכירה כולל: ${summary?.totalSellValue ?? 0}`],
    [`רווח פוטנציאלי: ${summary?.totalPotentialProfit ?? 0}`],
    [],
    ['=== טלפונים במלאי ==='],
    ['שם', 'יצרן', 'דגם', 'IMEI', 'ספק', 'עלות', 'מחיר מכירה', 'רווח', 'נכנס למלאי'],
  ];

  const phoneRows = (phones || []).map((p) => [
    p.name,
    p.make,
    p.model,
    p.imei,
    p.supplier,
    p.buyPrice,
    p.sellPrice,
    p.profit,
    formatDateHe(p.stockEnteredAt),
  ]);

  const accessorySection = [
    [],
    ['=== אביזרים במלאי ==='],
    ['שם', 'SKU', 'קטגוריה', 'כמות', 'עלות יחידה', 'מחיר יחידה', 'שווי קנייה', 'שווי מכירה', 'רווח'],
  ];

  const accessoryRows = (accessories || []).map((p) => [
    p.name,
    p.sku,
    p.category,
    p.stockQuantity,
    p.buyPrice,
    p.sellPrice,
    p.lineBuyValue,
    p.lineSellValue,
    p.lineProfit,
  ]);

  const repairSection = [
    [],
    ['=== תיקונים פתוחים (לא נמסרו) ==='],
    ['מספר', 'מכשיר', 'לקוח', 'סטטוס', 'מחיר ללקוח'],
  ];

  const repairRows = (openRepairs || []).map((r) => [
    r.ticketNumber,
    r.deviceModel,
    r.customerName,
    r.status,
    r.finalCustomerPrice,
  ]);

  const csv = [...meta, ...phoneRows, ...accessorySection, ...accessoryRows, ...repairSection, ...repairRows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');

  downloadFile(`inventory-report-${year}-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
}

/** דוח מלאי סוף שנה – PDF (הדפסה) */
export function printInventoryReport(report) {
  const { year, asOfDate, summary, phones, accessories, openRepairs } = report;
  const asOf = formatDateHe(asOfDate);

  const phoneRows = (phones || [])
    .map(
      (p) => `
      <tr>
        <td>${p.name}</td><td>${p.make} ${p.model}</td><td>${p.imei}</td>
        <td>${formatCurrency(p.buyPrice)}</td><td>${formatCurrency(p.sellPrice)}</td>
        <td>${formatCurrency(p.profit)}</td>
      </tr>`
    )
    .join('');

  const accessoryRows = (accessories || [])
    .map(
      (p) => `
      <tr>
        <td>${p.name}</td><td>${p.sku || '—'}</td><td>${p.category}</td><td>${p.stockQuantity}</td>
        <td>${formatCurrency(p.lineBuyValue)}</td><td>${formatCurrency(p.lineSellValue)}</td>
      </tr>`
    )
    .join('');

  const repairRows = (openRepairs || [])
    .map(
      (r) => `
      <tr>
        <td>${r.ticketNumber}</td><td>${r.deviceModel}</td><td>${r.customerName}</td>
        <td>${r.status}</td><td>${formatCurrency(r.finalCustomerPrice)}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8" />
  <title>דוח מלאי סוף שנה ${year}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
    h1 { font-size: 20px; } .meta { color: #555; margin-bottom: 20px; }
    .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi { border: 1px solid #ddd; padding: 12px; border-radius: 8px; }
    .kpi label { display: block; font-size: 12px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px; }
    th, td { border: 1px solid #ddd; padding: 6px; text-align: right; }
    th { background: #f5f5f5; }
    h2 { font-size: 15px; margin: 16px 0 8px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>דוח מלאי סוף שנה ${year}</h1>
  <div class="meta">נכון לתאריך: ${asOf} | נוצר: ${new Date().toLocaleString('he-IL')}</div>
  <div class="kpis">
    <div class="kpi"><label>טלפונים במלאי</label><strong>${summary?.phoneCount ?? 0}</strong></div>
    <div class="kpi"><label>יחידות אביזרים</label><strong>${summary?.accessoryUnits ?? 0}</strong></div>
    <div class="kpi"><label>שווי מכירה כולל</label><strong>${formatCurrency(summary?.totalSellValue)}</strong></div>
    <div class="kpi"><label>שווי קנייה כולל</label><strong>${formatCurrency(summary?.totalBuyValue)}</strong></div>
    <div class="kpi"><label>רווח פוטנציאלי</label><strong>${formatCurrency(summary?.totalPotentialProfit)}</strong></div>
    <div class="kpi"><label>תיקונים פתוחים</label><strong>${summary?.openRepairsCount ?? 0}</strong></div>
  </div>
  <h2>טלפונים במלאי (${phones?.length ?? 0})</h2>
  <table><thead><tr><th>שם</th><th>דגם</th><th>IMEI</th><th>עלות</th><th>מכירה</th><th>רווח</th></tr></thead>
  <tbody>${phoneRows || '<tr><td colspan="6">אין</td></tr>'}</tbody></table>
  <h2>אביזרים במלאי (${accessories?.length ?? 0} פריטים)</h2>
  <table><thead><tr><th>שם</th><th>SKU</th><th>קטגוריה</th><th>כמות</th><th>שווי קנייה</th><th>שווי מכירה</th></tr></thead>
  <tbody>${accessoryRows || '<tr><td colspan="6">אין</td></tr>'}</tbody></table>
  <h2>תיקונים פתוחים (${openRepairs?.length ?? 0})</h2>
  <table><thead><tr><th>מספר</th><th>מכשיר</th><th>לקוח</th><th>סטטוס</th><th>מחיר</th></tr></thead>
  <tbody>${repairRows || '<tr><td colspan="5">אין</td></tr>'}</tbody></table>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('לא ניתן לפתוח חלון הדפסה.');
    return;
  }
  win.document.write(html);
  win.document.close();
}

/** דוח פיננסי להדפסה */
export function printDashboardReport({ dashboard, transactions }) {
  const month = dashboard?.summary?.thisMonth;
  const breakdown = dashboard?.charts?.breakdown?.details || [];

  const txnRows = transactions
    .map(
      (txn) => `
      <tr>
        <td>${formatDate(txn.createdAt)}</td>
        <td>${txn.transactionNumber || '—'}</td>
        <td>${txn.items?.[0]?.name || '—'}</td>
        <td>${txn.customer?.fullName || 'לקוח מזדמן'}</td>
        <td>${formatCurrency(txn.total)}</td>
        <td>${formatCurrency(txn.totalProfit)}</td>
      </tr>`
    )
    .join('');

  const breakdownRows = breakdown
    .map(
      (item) => `
      <tr>
        <td>${item.category}</td>
        <td>${formatCurrency(item.revenue)}</td>
        <td>${formatCurrency(item.profit)}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8" />
  <title>דוח פיננסי - חנות סלולר</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .meta { color: #555; margin-bottom: 20px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi { border: 1px solid #ddd; padding: 12px; border-radius: 8px; }
    .kpi label { display: block; font-size: 12px; color: #666; }
    .kpi strong { font-size: 18px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 13px; }
    th { background: #f5f5f5; }
    h2 { font-size: 16px; margin: 16px 0 8px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>דוח פיננסי – חנות סלולר</h1>
  <div class="meta">נוצר: ${new Date().toLocaleString('he-IL')}</div>

  <div class="kpis">
    <div class="kpi"><label>הכנסות החודש</label><strong>${formatCurrency(month?.grossRevenue)}</strong></div>
    <div class="kpi"><label>רווח נקי</label><strong>${formatCurrency(month?.netProfit)}</strong></div>
    <div class="kpi"><label>מרווח ממוצע</label><strong>${month?.profitMarginPercent ?? 0}%</strong></div>
    <div class="kpi"><label>מכירות תיקונים</label><strong>${month?.repairSalesCount ?? 0}</strong></div>
  </div>

  <h2>פילוח לפי קטגוריה</h2>
  <table>
    <thead><tr><th>קטגוריה</th><th>הכנסות</th><th>רווח</th></tr></thead>
    <tbody>${breakdownRows || '<tr><td colspan="3">אין נתונים</td></tr>'}</tbody>
  </table>

  <h2>עסקאות אחרונות</h2>
  <table>
    <thead><tr><th>תאריך</th><th>מספר</th><th>פריט</th><th>לקוח</th><th>סכום</th><th>רווח</th></tr></thead>
    <tbody>${txnRows || '<tr><td colspan="6">אין עסקאות</td></tr>'}</tbody>
  </table>

  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('לא ניתן לפתוח חלון הדפסה.');
    return;
  }
  win.document.write(html);
  win.document.close();
}
