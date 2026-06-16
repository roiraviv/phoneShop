import { formatCurrency, formatDate } from './format';

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
