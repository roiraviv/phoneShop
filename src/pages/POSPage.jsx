import { useCallback, useEffect, useRef, useState } from 'react';
import TopNav from '../components/layout/TopNav';
import Icon from '../components/ui/Icon';
import { scanProduct, createSale, previewSale } from '../api/sales';
import { fetchProducts } from '../api/products';
import { fetchCustomers, fetchCustomer } from '../api/customers';
import { fetchRepairs } from '../api/repairs';
import { fetchSettings } from '../api/settings';
import { DEFAULT_POS_CUSTOMER } from '../constants';
import { formatCurrency, formatDate, getInitials } from '../utils/format';
import { printReceiptSlip } from '../utils/receiptPrint';

const REPAIR_READY_STATUS = 'תוקן';

export default function POSPage() {
  const [settings, setSettings] = useState(null);
  const [taxRate, setTaxRate] = useState(0.18);
  const [cart, setCart] = useState([]);
  const [scanCode, setScanCode] = useState('');
  const [quickProducts, setQuickProducts] = useState([]);
  const [readyRepairs, setReadyRepairs] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [defaultCustomer, setDefaultCustomer] = useState({ ...DEFAULT_POS_CUSTOMER });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isExplicitCustomer, setIsExplicitCustomer] = useState(false);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [totals, setTotals] = useState({ subtotal: 0, total: 0 });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const scanRef = useRef(null);

  const loadReadyRepairs = useCallback(() => {
    fetchRepairs(REPAIR_READY_STATUS)
      .then((res) => setReadyRepairs(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchProducts({ quickAdd: 'true' })
      .then((res) => setQuickProducts(res.data.slice(0, 4)))
      .catch(console.error);
    fetchSettings()
      .then(async (res) => {
        setSettings(res.data);
        setTaxRate(res.data.taxRate ?? 0.);
        if (res.data.defaultPosCustomerId) {
          try {
            const custRes = await fetchCustomer(res.data.defaultPosCustomerId);
            setDefaultCustomer(custRes.data);
          } catch {
            setDefaultCustomer({ ...DEFAULT_POS_CUSTOMER });
          }
        }
      })
      .catch(console.error);
    loadReadyRepairs();
  }, [loadReadyRepairs]);

  const buildSaleItems = useCallback(
    () =>
      cart.map((item) =>
        item.type === 'repair'
          ? { type: 'repair', repairId: item.id }
          : { type: 'product', productId: item.id, quantity: item.quantity }
      ),
    [cart]
  );

  useEffect(() => {
    if (cart.length === 0) {
      setTotals({ subtotal: 0, total: 0 });
      return;
    }
    previewSale(buildSaleItems())
      .then((res) => {
        const tax = res.data.subtotal * taxRate;
        setTotals({
          subtotal: res.data.subtotal,
          total: res.data.subtotal + tax,
        });
      })
      .catch(console.error);
  }, [cart, buildSaleItems, taxRate]);

  const addProductToCart = (product, qty = 1) => {
    setCart((prev) => {
      const key = `product-${product.id}`;
      const existing = prev.find((p) => p.cartKey === key);
      if (existing) {
        return prev.map((p) =>
          p.cartKey === key ? { ...p, quantity: p.quantity + qty } : p
        );
      }
      return [
        ...prev,
        {
          cartKey: key,
          type: 'product',
          id: product.id,
          name: product.name,
          sellPrice: product.sellPrice,
          sku: product.sku,
          imei: product.imei,
          productType: product.productType,
          quantity: qty,
        },
      ];
    });
  };

  const addRepairToCart = (repair) => {
    const key = `repair-${repair.id}`;
    setCart((prev) => {
      if (prev.some((p) => p.cartKey === key)) return prev;
      return [
        ...prev,
        {
          cartKey: key,
          type: 'repair',
          id: repair.id,
          name: `תיקון ${repair.deviceModel}`,
          ticketNumber: repair.ticketNumber,
          sellPrice: repair.finalCustomerPrice,
          quantity: 1,
        },
      ];
    });
  };

  const handleScan = async (code) => {
    if (!code.trim()) return;
    setError('');
    try {
      const res = await scanProduct(code.trim());
      addProductToCart(res.data.product);
      setScanCode('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleScanKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScan(scanCode);
    }
  };

  const updateQty = (cartKey, delta) => {
    setCart((prev) =>
      prev
        .map((p) =>
          p.cartKey === cartKey && p.type === 'product'
            ? { ...p, quantity: Math.max(1, p.quantity + delta) }
            : p
        )
        .filter((p) => p.quantity > 0)
    );
  };

  const removeItem = (cartKey) => setCart((prev) => prev.filter((p) => p.cartKey !== cartKey));

  const handleCustomerSearch = async (value) => {
    setCustomerSearch(value);
    if (value.length < 3) return;
    try {
      const res = await fetchCustomers(value);
      if (res.data[0]) {
        const full = await fetchCustomer(res.data[0].id);
        setSelectedCustomer(full.data);
        setIsExplicitCustomer(true);
        setCustomerHistory(full.data.history || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetToDefaultCustomer = () => {
    setSelectedCustomer(null);
    setIsExplicitCustomer(false);
    setCustomerSearch('');
    setCustomerHistory([]);
  };

  const activeCustomer = isExplicitCustomer ? selectedCustomer : defaultCustomer;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    setError('');
    try {
      const res = await createSale({
        customerId: isExplicitCustomer
          ? selectedCustomer?.id
          : defaultCustomer?.id ?? null,
        items: buildSaleItems(),
        paymentMethod: 'מזומן',
        scannedViaBarcode: true,
      });

      const transaction = res.data.transaction;
      printReceiptSlip({
        transaction,
        settings,
        customer: isExplicitCustomer ? selectedCustomer : null,
        showCustomerDetails: isExplicitCustomer,
        taxRate,
      });

      setCart([]);
      resetToDefaultCustomer();
      loadReadyRepairs();
      scanRef.current?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const tax = totals.subtotal * taxRate;

  return (
    <div className="page-shell">
      <TopNav title="קופה – חנות סלולר" />
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 md:p-4 gap-3 md:gap-4 min-h-0 pb-20 md:pb-4">
        <section className="flex-1 flex flex-col gap-gutter bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
          <div className="p-lg bg-surface border-b border-outline-variant">
            <div className="relative">
              <Icon name="barcode_scanner" className="absolute left-md top-1/2 -translate-y-1/2 text-primary" />
              <input
                ref={scanRef}
                autoFocus
                className="w-full pl-xl pr-28 py-md font-data-mono text-data-mono rounded-lg border-2 border-outline-variant focus:border-primary focus:ring-0 bg-surface-container-lowest shadow-sm placeholder:font-body-md placeholder:text-secondary h-[56px]"
                placeholder="סרוק ברקוד / IMEI / מוצר..."
                type="text"
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                onKeyDown={handleScanKeyDown}
              />
              <button
                type="button"
                className="absolute right-md top-1/2 -translate-y-1/2 px-md py-sm bg-primary-container text-on-primary-container rounded font-label-md text-label-md hover:bg-primary hover:text-on-primary transition-colors"
                onClick={() => handleScan(scanCode)}
              >
                חפש
              </button>
            </div>
            {error && <p className="text-error font-body-sm mt-sm">{error}</p>}
          </div>

          {readyRepairs.length > 0 && (
            <div className="px-lg pt-md">
              <h3 className="font-title-sm text-title-sm mb-sm text-secondary flex items-center gap-xs">
                <Icon name="build" className="text-[18px]" />
                תיקונים מוכנים לאיסוף
              </h3>
              <div className="flex flex-wrap gap-sm">
                {readyRepairs.map((repair) => {
                  const inCart = cart.some((c) => c.cartKey === `repair-${repair.id}`);
                  return (
                    <button
                      key={repair.id}
                      type="button"
                      disabled={inCart}
                      className="flex flex-col items-start p-sm bg-surface border border-outline-variant rounded-lg hover:border-primary transition-all min-w-[160px] disabled:opacity-50"
                      onClick={() => addRepairToCart(repair)}
                    >
                      <span className="font-label-md text-on-surface">{repair.deviceModel}</span>
                      <span className="font-data-mono text-[11px] text-secondary">{repair.ticketNumber}</span>
                      <span className="font-data-mono text-primary mt-xs">{formatCurrency(repair.finalCustomerPrice)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="px-lg pt-md">
            <h3 className="font-title-sm text-title-sm mb-sm text-secondary">הוספה מהירה</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
              {quickProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="flex flex-col items-center justify-center p-sm bg-surface border border-outline-variant rounded-lg hover:border-primary hover:shadow-sm transition-all h-24 group"
                  onClick={() => addProductToCart(p)}
                >
                  <Icon
                    name={p.category === 'מטען' ? 'power' : p.category === 'כבל' ? 'cable' : 'crop_portrait'}
                    className="text-secondary group-hover:text-primary mb-xs"
                  />
                  <span className="font-label-md text-label-md text-center text-on-surface line-clamp-2">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-lg py-md">
            <table className="w-full text-left border-collapse">
              <thead className="font-label-md text-label-md text-secondary border-b-2 border-outline-variant sticky top-0 bg-surface-container-low z-10">
                <tr>
                  <th className="pb-sm font-normal">פריט</th>
                  <th className="pb-sm font-normal w-24 text-center">כמות</th>
                  <th className="pb-sm font-normal w-24 text-right">מחיר</th>
                  <th className="pb-sm font-normal w-12 text-center" />
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-secondary">
                      סרוק מוצר או הוסף תיקון מוכן
                    </td>
                  </tr>
                ) : (
                  cart.map((item, i) => (
                    <tr
                      key={item.cartKey}
                      className={`border-b border-outline-variant ${i % 2 ? 'bg-surface-container-low' : 'bg-surface-container-lowest'}`}
                    >
                      <td className="py-md pr-sm">
                        <div className="flex items-center gap-xs">
                          {item.type === 'repair' && (
                            <span className="text-[10px] bg-tertiary-container text-on-tertiary-container px-xs py-[2px] rounded">תיקון</span>
                          )}
                          <div className="font-title-sm text-title-sm text-on-surface">{item.name}</div>
                        </div>
                        {item.ticketNumber && (
                          <div className="font-data-mono text-data-mono text-secondary mt-xs text-[12px]">
                            {item.ticketNumber}
                          </div>
                        )}
                        {(item.imei || item.sku) && (
                          <div className="font-data-mono text-data-mono text-secondary mt-xs text-[12px]">
                            {item.imei ? `IMEI: ${item.imei}` : `SKU: ${item.sku}`}
                          </div>
                        )}
                      </td>
                      <td className="py-md text-center">
                        {item.type === 'repair' ? (
                          <span className="font-data-mono">1</span>
                        ) : (
                          <div className="flex items-center justify-center gap-xs">
                            <button type="button" className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center hover:bg-outline-variant" onClick={() => updateQty(item.cartKey, -1)}>-</button>
                            <span className="w-8 text-center font-data-mono">{item.quantity}</span>
                            <button type="button" className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center hover:bg-outline-variant" onClick={() => updateQty(item.cartKey, 1)}>+</button>
                          </div>
                        )}
                      </td>
                      <td className="py-md text-right font-data-mono">
                        {formatCurrency(item.sellPrice * item.quantity)}
                      </td>
                      <td className="py-md text-center">
                        <button type="button" className="text-error hover:bg-error rounded p-xs transition-colors" onClick={() => removeItem(item.cartKey)}>
                          <Icon name="delete" className="text-[20px]" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-surface p-lg border-t border-outline-variant">
            <div className="flex justify-between items-center mb-sm font-body-md text-secondary">
              <span>סכום ביניים</span>
              <span className="font-data-mono">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center mb-md font-body-md text-secondary">
              <span>מע&quot;מ ({(taxRate * 100).toFixed(0)}%)</span>
              <span className="font-data-mono">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between items-center mb-lg font-display-lg text-display-lg text-on-surface">
              <span>סה&quot;כ לתשלום</span>
              <span className="font-data-mono text-primary">{formatCurrency(totals.total)}</span>
            </div>
            <button
              type="button"
              disabled={cart.length === 0 || processing}
              className="w-full bg-primary text-on-primary py-md rounded-lg font-title-sm text-title-sm hover:bg-surface-tint transition-colors flex items-center justify-center gap-sm h-14 disabled:opacity-50"
              onClick={handleCheckout}
            >
              <Icon name="receipt_long" />
              {processing ? 'מעבד...' : 'סיום והדפסת קבלה'}
            </button>
            <p className="text-center text-secondary font-body-sm mt-sm">
              מדפסת BIXOLON SRP-330 (80mm)
            </p>
          </div>
        </section>

        <aside className="w-full lg:w-[400px] flex flex-col gap-gutter">
          <div className="bg-surface rounded-xl border border-outline-variant p-lg shadow-sm">
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-sm">
                <Icon name="person_search" className="text-primary" />
                לקוח
              </h3>
              {isExplicitCustomer && (
                <button
                  type="button"
                  onClick={resetToDefaultCustomer}
                  className="text-primary font-label-md text-label-md hover:underline"
                >
                  ברירת מחדל
                </button>
              )}
            </div>
            <div className="relative mb-lg">
              <Icon name="search" className="absolute left-md top-1/2 -translate-y-1/2 text-secondary text-[20px]" />
              <input
                className="w-full pl-xl pr-md py-sm font-body-md text-body-md rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest h-12"
                placeholder="חיפוש לפי שם או טלפון..."
                type="text"
                value={customerSearch}
                onChange={(e) => handleCustomerSearch(e.target.value)}
              />
            </div>
            {activeCustomer && (
              <div className={`bg-surface-container-low rounded-lg p-md border relative overflow-hidden ${isExplicitCustomer ? 'border-primary' : 'border-outline-variant'}`}>
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isExplicitCustomer ? 'bg-primary' : 'bg-outline-variant'}`} />
                {!isExplicitCustomer && (
                  <span className="font-label-md text-[10px] text-secondary bg-surface-variant px-xs py-[2px] rounded mb-sm inline-block">
                    ברירת מחדל
                  </span>
                )}
                <div className="flex items-center gap-md">
                  <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-headline-md">
                    {getInitials(activeCustomer.fullName)}
                  </div>
                  <div>
                    <h4 className="font-title-sm text-title-sm text-on-surface">{activeCustomer.fullName}</h4>
                    {activeCustomer.phone && (
                      <p className="font-data-mono text-data-mono text-secondary">{activeCustomer.phone}</p>
                    )}
                    {isExplicitCustomer && activeCustomer.customerType === 'business' && activeCustomer.companyId && (
                      <p className="font-data-mono text-[11px] text-secondary">ח.פ. {activeCustomer.companyId}</p>
                    )}
                    {isExplicitCustomer && activeCustomer.customerType !== 'business' && activeCustomer.nationalId && (
                      <p className="font-data-mono text-[11px] text-secondary">ת.ז. {activeCustomer.nationalId}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-surface rounded-xl border border-outline-variant shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="p-lg border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="font-title-sm text-title-sm text-on-surface flex items-center gap-sm">
                <Icon name="history" className="text-secondary" />
                היסטוריה אחרונה
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-md bg-surface-container-low">
              {customerHistory.length === 0 ? (
                <p className="text-secondary font-body-sm text-center py-8">
                  {isExplicitCustomer ? 'אין היסטוריה ללקוח זה' : 'חפש לקוח לצפייה בהיסטוריה'}
                </p>
              ) : (
                <ul className="space-y-sm">
                  {customerHistory.map((item) => (
                    <li key={item.id} className="bg-surface rounded-lg border border-outline-variant p-md flex justify-between items-center">
                      <div>
                        <div className="font-label-lg text-label-lg text-on-surface">{item.items}</div>
                        <div className="font-body-sm text-body-sm text-secondary">
                          {formatDate(item.date)} • {item.type === 'repair' ? `תיקון ${item.ticketNumber}` : 'רכישה'}
                        </div>
                      </div>
                      <div className="font-data-mono text-data-mono text-on-surface">{formatCurrency(item.total)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
