import JsBarcode from 'jsbarcode';

/** קביעת ברקוד: 915=תיקון, 916=מכירת מכשיר */
export function getReceiptBarcodeValue(items) {
  const hasPhone = items.some(
    (i) => i.itemType === 'phone' || i.productType === 'phone'
  );
  const hasRepair = items.some((i) => i.itemType === 'repair');
  return hasRepair && !hasPhone ? '915' : '916';
}

function formatReceiptCurrency(amount) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function formatReceiptDate(dateStr) {
  return new Date(dateStr || Date.now()).toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildBarcodeSvg(value) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, value, {
    format: 'CODE128',
    width: 2,
    height: 56,
    displayValue: true,
    fontSize: 14,
    margin: 4,
    textMargin: 2,
  });
  return svg.outerHTML;
}

function buildCustomerSlipLines(customer) {
  if (!customer?.fullName) return '';
  const idLine =
    customer.customerType === 'business' && customer.companyId
      ? `ח.פ.: ${customer.companyId}`
      : customer.nationalId
        ? `ת.ז.: ${customer.nationalId}`
        : '';
  return `
    <div class="muted">לקוח: ${customer.fullName}</div>
    ${customer.phone ? `<div class="muted">טלפון: ${customer.phone}</div>` : ''}
    ${idLine ? `<div class="muted">${idLine}</div>` : ''}
  `;
}

/**
 * הדפסת קבלה ל-BIXOLON SRP-330 (80mm) – מחיר ללקוח בלבד, ללא עלויות/רווח
 */
export function printReceiptSlip({
  transaction,
  settings,
  customer,
  showCustomerDetails = false,
  taxRate = 0.18,
}) {
  const items = transaction.items || [];
  const subtotal = transaction.subtotal ?? items.reduce(
    (s, i) => s + (i.unitSellPrice || 0) * (i.quantity || 1),
    0
  );
  const tax = subtotal * taxRate;
  const total = transaction.total ?? subtotal + tax;
  const barcodeValue = getReceiptBarcodeValue(items);

  const itemRows = items
    .map((item) => {
      const qty = item.quantity || 1;
      const price = item.unitSellPrice || 0;
      const lineTotal = price * qty;
      const detail =
        item.itemType === 'repair'
          ? 'תיקון'
          : item.itemType === 'phone'
            ? `IMEI: ${item.imei || '—'}`
            : '';
      return `
        <tr>
          <td class="item-name">${item.name}</td>
          <td class="item-qty">${qty}</td>
          <td class="item-price">${formatReceiptCurrency(lineTotal)}</td>
        </tr>
        ${detail ? `<tr><td colspan="3" class="item-detail">${detail}</td></tr>` : ''}
      `;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8" />
  <title>קבלה ${transaction.transactionNumber}</title>
  <style>
    @page { size: 80mm auto; margin: 2mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, 'Segoe UI', sans-serif;
      font-size: 12px;
      width: 72mm;
      max-width: 72mm;
      margin: 0 auto;
      color: #000;
      background: #fff;
      line-height: 1.35;
    }
    .center { text-align: center; }
    .store-name { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
    .muted { color: #333; font-size: 11px; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; }
    .item-name { text-align: right; padding: 3px 0; vertical-align: top; }
    .item-qty { text-align: center; width: 24px; padding: 3px 2px; }
    .item-price { text-align: left; white-space: nowrap; padding: 3px 0; }
    .item-detail { font-size: 10px; color: #444; padding-bottom: 4px; }
    .totals td { padding: 3px 0; }
    .totals .label { text-align: right; }
    .totals .value { text-align: left; font-weight: bold; }
    .grand-total { font-size: 15px; font-weight: bold; margin-top: 4px; }
    .barcode-wrap { margin-top: 10px; text-align: center; }
    .footer { margin-top: 8px; font-size: 11px; text-align: center; }
    @media screen {
      body { padding: 16px; border: 1px solid #ccc; }
    }
  </style>
</head>
<body>
  <div class="center">
    <div class="store-name">${settings?.storeName || 'חנות סלולר'}</div>
    ${settings?.storePhone ? `<div class="muted">${settings.storePhone}</div>` : ''}
    ${settings?.storeAddress ? `<div class="muted">${settings.storeAddress}</div>` : ''}
  </div>

  <div class="divider"></div>

  <div class="muted">מספר עסקה: ${transaction.transactionNumber}</div>
  <div class="muted">תאריך: ${formatReceiptDate(transaction.createdAt)}</div>
  ${showCustomerDetails ? buildCustomerSlipLines(customer) : ''}

  <div class="divider"></div>

  <table>
    <thead>
      <tr class="muted">
        <th style="text-align:right">פריט</th>
        <th>כמות</th>
        <th style="text-align:left">מחיר</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="divider"></div>

  <table class="totals">
    <tr><td class="label">סכום ביניים</td><td class="value">${formatReceiptCurrency(subtotal)}</td></tr>
    <tr><td class="label">מע&quot;מ (${(taxRate * 100).toFixed(0)}%)</td><td class="value">${formatReceiptCurrency(tax)}</td></tr>
    <tr><td class="label grand-total">סה&quot;כ לתשלום</td><td class="value grand-total">${formatReceiptCurrency(total)}</td></tr>
  </table>

  <div class="divider"></div>

  <div class="barcode-wrap">${buildBarcodeSvg(barcodeValue)}</div>

  ${settings?.receiptFooter ? `<div class="footer">${settings.receiptFooter}</div>` : '<div class="footer">תודה שקניתם אצלנו!</div>'}

  <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=320,height=640');
  if (!win) {
    alert('לא ניתן לפתוח חלון הדפסה. אפשר חלונות קופצים בדפדפן.');
    return;
  }
  win.document.write(html);
  win.document.close();
}
