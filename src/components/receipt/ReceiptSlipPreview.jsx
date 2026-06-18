import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { getReceiptBarcodeValue } from '../../utils/receiptPrint';
import { formatCurrency } from '../../utils/format';

function formatReceiptDate(dateStr) {
  return new Date(dateStr || Date.now()).toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReceiptSlipPreview({ transaction, settings, customer, taxRate = 0.18 }) {
  const barcodeRef = useRef(null);

  const items = transaction?.items || [];
  const subtotal = transaction?.subtotal ?? items.reduce(
    (s, i) => s + (i.unitSellPrice || 0) * (i.quantity || 1),
    0
  );
  const discount = transaction?.discount || 0;
  const tax = subtotal * taxRate;
  const total = transaction?.total ?? Math.max(0, subtotal - discount + tax);

  useEffect(() => {
    if (!barcodeRef.current || !items.length) return;
    try {
      JsBarcode(barcodeRef.current, getReceiptBarcodeValue(items), {
        format: 'CODE128',
        width: 2,
        height: 56,
        displayValue: true,
        fontSize: 14,
        margin: 4,
        textMargin: 2,
      });
    } catch {
      // ignore invalid barcode
    }
  }, [items, transaction?.id]);

  if (!transaction) return null;

  const idLine =
    customer?.customerType === 'business' && customer?.companyId
      ? `ח.פ.: ${customer.companyId}`
      : customer?.nationalId
        ? `ת.ז.: ${customer.nationalId}`
        : '';

  return (
    <div className="mx-auto w-full max-w-[320px] bg-white text-black rounded-lg border border-outline-variant p-4 font-sans text-[12px] leading-snug shadow-inner">
      <div className="text-center mb-3">
        <p className="text-base font-bold">{settings?.storeName || 'חנות סלולר'}</p>
        {settings?.storePhone && <p className="text-[11px] text-gray-700">{settings.storePhone}</p>}
        {settings?.storeAddress && <p className="text-[11px] text-gray-700">{settings.storeAddress}</p>}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2" />

      <p className="text-[11px] text-gray-700">מספר עסקה: {transaction.transactionNumber}</p>
      <p className="text-[11px] text-gray-700">תאריך: {formatReceiptDate(transaction.createdAt)}</p>
      {customer?.fullName && (
        <>
          <p className="text-[11px] text-gray-700 mt-1">לקוח: {customer.fullName}</p>
          {customer.phone && <p className="text-[11px] text-gray-700">טלפון: {customer.phone}</p>}
          {idLine && <p className="text-[11px] text-gray-700">{idLine}</p>}
        </>
      )}

      <div className="border-t border-dashed border-gray-400 my-2" />

      <table className="w-full border-collapse">
        <thead>
          <tr className="text-[11px] text-gray-600">
            <th className="text-right pb-1">פריט</th>
            <th className="text-center pb-1 w-8">כמות</th>
            <th className="text-left pb-1">מחיר</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const qty = item.quantity || 1;
            const lineTotal = (item.unitSellPrice || 0) * qty;
            const detail =
              item.itemType === 'repair'
                ? 'תיקון'
                : item.itemType === 'phone'
                  ? `IMEI: ${item.imei || '—'}`
                  : null;
            return (
              <tr key={`${item.referenceId}-${i}`}>
                <td colSpan={3} className="pt-2">
                  <div className="flex justify-between gap-2">
                    <span className="text-right flex-1">{item.name}</span>
                    <span className="text-center w-6">{qty}</span>
                    <span className="text-left whitespace-nowrap">{formatCurrency(lineTotal)}</span>
                  </div>
                  {detail && <p className="text-[10px] text-gray-500 mt-0.5">{detail}</p>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="border-t border-dashed border-gray-400 my-2" />

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>סכום ביניים</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>הנחה</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>מע&quot;מ ({(taxRate * 100).toFixed(0)}%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between font-bold text-[15px] pt-1">
          <span>סה&quot;כ לתשלום</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-400 my-3" />

      <div className="flex justify-center">
        <svg ref={barcodeRef} />
      </div>

      <p className="text-center text-[11px] mt-3 text-gray-600">
        {settings?.receiptFooter || 'תודה שקניתם אצלנו!'}
      </p>
    </div>
  );
}
