import { useCallback, useEffect, useState } from 'react';
import TopNav from '../components/layout/TopNav';
import Icon from '../components/ui/Icon';
import Modal from '../components/ui/Modal';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../api/products';
import api from '../api/client';
import {
  ACCESSORY_CATEGORIES,
  PHONE_STOCK_STATUS,
  STOCK_STATUS_LABELS,
} from '../constants';
import { formatCurrency, formatDateHe } from '../utils/format';

const MAX_QUICK_ADD = 8;

function getQuickAddIconName(category) {
  if (category === 'מטען') return 'power';
  if (category === 'כבל') return 'cable';
  return 'crop_portrait';
}

function todayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

const TABS = [
  { key: 'all', label: 'הכל' },
  { key: 'phone', label: 'טלפונים' },
  { key: 'accessory', label: 'אביזרים' },
];

const EMPTY_PHONE = {
  productType: 'phone',
  name: '',
  make: '',
  model: '',
  imei: '',
  buyPrice: '',
  sellPrice: '',
  stockStatus: PHONE_STOCK_STATUS.IN_STOCK,
  supplier: '',
  stockEnteredAt: todayDateInput(),
};

const EMPTY_ACCESSORY = {
  productType: 'accessory',
  name: '',
  sku: '',
  barcode: '',
  category: ACCESSORY_CATEGORIES[0],
  buyPrice: '',
  sellPrice: '',
  stockQuantity: '',
  lowStockThreshold: '5',
};

function StockBadge({ product }) {
  if (product.productType === 'phone') {
    const cfg = STOCK_STATUS_LABELS[product.stockStatus] || STOCK_STATUS_LABELS['במלאי'];
    return (
      <span className={`font-label-md text-label-md px-sm py-xs rounded-full ${cfg.className}`}>
        {cfg.label}
      </span>
    );
  }

  if (product.isLowStock) {
    return (
      <span className="font-label-md text-label-md px-sm py-xs rounded-full bg-error-container text-on-error-container flex items-center gap-1">
        <Icon name="warning" className="text-[14px]" />
        Low: {product.stockQuantity}
      </span>
    );
  }

  return (
    <span className="font-label-md text-label-md px-sm py-xs rounded-full bg-[#d1fae5] text-[#065f46]">
      {product.stockQuantity} units
    </span>
  );
}

function ProductForm({ form, setForm, isPhone, isEditing, supplierSuggestions = [] }) {
  const field = (label, key, props = {}) => (
    <div>
      <label className="font-label-md text-label-md text-secondary block mb-xs">{label}</label>
      <input
        className="w-full px-md py-sm border border-outline-variant rounded-lg font-body-sm focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest"
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        {...props}
      />
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
      {field('Name', 'name', { required: true })}
      {field('Buy Price', 'buyPrice', { type: 'number', min: 0, step: 0.01 })}
      {field('Sell Price', 'sellPrice', { type: 'number', min: 0, step: 0.01 })}
      {isPhone ? (
        <>
          {field('יצרן', 'make')}
          {field('דגם', 'model')}
          {field('IMEI', 'imei')}
          <div>
            <label className="font-label-md text-label-md text-secondary block mb-xs">ספק</label>
            <input
              list="supplier-suggestions"
              className="w-full px-md py-sm border border-outline-variant rounded-lg font-body-sm focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest"
              value={form.supplier || ''}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              placeholder="שם הספק / מקור הרכישה"
            />
            <datalist id="supplier-suggestions">
              {supplierSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="font-label-md text-label-md text-secondary block mb-xs">תאריך כניסה למלאי</label>
            {isEditing ? (
              <p className="px-md py-sm border border-outline-variant rounded-lg font-body-sm bg-surface-container-low text-on-surface">
                {formatDateHe(form.stockEnteredAt || form.createdAt)}
              </p>
            ) : (
              <input
                type="date"
                className="w-full px-md py-sm border border-outline-variant rounded-lg font-body-sm focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest"
                value={form.stockEnteredAt?.slice?.(0, 10) || form.stockEnteredAt || todayDateInput()}
                onChange={(e) => setForm({ ...form, stockEnteredAt: e.target.value })}
              />
            )}
          </div>
        </>
      ) : (
        <>
          {field('SKU', 'sku')}
          {field('Barcode', 'barcode')}
          {field('Stock Quantity', 'stockQuantity', { type: 'number', min: 0 })}
          {field('Low Stock Threshold', 'lowStockThreshold', { type: 'number', min: 0 })}
          <div className="md:col-span-2">
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.isQuickAdd}
                onChange={(e) => setForm({ ...form, isQuickAdd: e.target.checked })}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span className="font-label-md text-label-md text-on-surface">כפתור מכירה מהירה בקופה</span>
            </label>
            <p className="font-body-sm text-secondary mt-xs mr-6">
              יוצג בקטע &quot;הוספה מהירה&quot; בדף הקופה (עד {MAX_QUICK_ADD} פריטים)
            </p>
          </div>
          <div>
            <label className="font-label-md text-label-md text-secondary block mb-xs">Category</label>
            <select
              className="w-full px-md py-sm border border-outline-variant rounded-lg font-body-sm focus:border-primary bg-surface-container-lowest"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {ACCESSORY_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PHONE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [quickAddMsg, setQuickAddMsg] = useState('');

  const quickAddProducts = products
    .filter((p) => p.isQuickAdd)
    .sort((a, b) => (a.quickAddOrder ?? 999) - (b.quickAddOrder ?? 999));

  const toggleQuickAdd = async (product) => {
    setQuickAddMsg('');
    try {
      if (product.isQuickAdd) {
        await updateProduct(product.id, { isQuickAdd: false, quickAddOrder: null });
      } else {
        const active = products.filter((p) => p.isQuickAdd);
        if (active.length >= MAX_QUICK_ADD) {
          setQuickAddMsg(`ניתן לבחור עד ${MAX_QUICK_ADD} כפתורי מכירה מהירה`);
          return;
        }
        const maxOrder = Math.max(0, ...active.map((p) => p.quickAddOrder ?? 0));
        await updateProduct(product.id, { isQuickAdd: true, quickAddOrder: maxOrder + 1 });
      }
      load();
    } catch (err) {
      setQuickAddMsg(err.message);
    }
  };

  const moveQuickAdd = async (product, direction) => {
    const list = [...quickAddProducts];
    const idx = list.findIndex((p) => p.id === product.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    [list[idx], list[swapIdx]] = [list[swapIdx], list[idx]];
    await Promise.all(
      list.map((p, i) => updateProduct(p.id, { quickAddOrder: i + 1 }))
    );
    load();
  };

  const load = useCallback(() => {
    const params = { search: search || undefined, type: tab === 'all' ? undefined : tab };
    Promise.all([
      fetchProducts(params),
      api.get('/analytics/alerts/low-stock'),
    ])
      .then(([prodRes, alertRes]) => {
        setProducts(prodRes.data.filter((p) => p.isActive !== false));
        setAlerts(alertRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, tab]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const openAdd = (type) => {
    setEditing(null);
    setForm(
      type === 'phone'
        ? { ...EMPTY_PHONE, stockEnteredAt: todayDateInput() }
        : { ...EMPTY_ACCESSORY }
    );
    setError('');
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({ ...product });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        buyPrice: Number(form.buyPrice),
        sellPrice: Number(form.sellPrice),
        ...(form.productType === 'accessory' && {
          stockQuantity: Number(form.stockQuantity),
          lowStockThreshold: Number(form.lowStockThreshold),
          isQuickAdd: !!form.isQuickAdd,
          quickAddOrder: form.isQuickAdd
            ? (editing?.quickAddOrder ?? null)
            : null,
        }),
        ...(form.productType === 'phone' && {
          supplier: form.supplier?.trim() || '',
          ...(!editing && form.stockEnteredAt ? { stockEnteredAt: form.stockEnteredAt } : {}),
        }),
      };

      if (form.productType === 'accessory' && form.isQuickAdd) {
        const active = products.filter((p) => p.isQuickAdd && p.id !== editing?.id);
        if (active.length >= MAX_QUICK_ADD && !editing?.isQuickAdd) {
          setError(`ניתן לבחור עד ${MAX_QUICK_ADD} כפתורי מכירה מהירה`);
          setSaving(false);
          return;
        }
        if (!payload.quickAddOrder) {
          const maxOrder = Math.max(0, ...active.map((p) => p.quickAddOrder ?? 0));
          payload.quickAddOrder = maxOrder + 1;
        }
      }

      if (editing) {
        await updateProduct(editing.id, payload);
      } else {
        await createProduct(payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`Remove "${product.name}" from inventory?`)) return;
    await deleteProduct(product.id);
    load();
  };

  const supplierSuggestions = [
    ...new Set(
      products
        .filter((p) => p.productType === 'phone' && p.supplier?.trim())
        .map((p) => p.supplier.trim())
    ),
  ].sort((a, b) => a.localeCompare(b, 'he'));

  const showPhoneColumns = tab === 'phone' || tab === 'all';

  const stats = {
    phones: products.filter((p) => p.productType === 'phone').length,
    accessories: products.filter((p) => p.productType === 'accessory').length,
    lowStock: products.filter((p) => p.isLowStock).length,
    inStock: products.filter((p) => p.productType === 'phone' && p.stockStatus === 'במלאי').length,
  };

  return (
    <div className="page-shell">
      <TopNav title="ניהול מלאי">
        <div className="relative hidden sm:block">
          <Icon name="search" className="absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
          <input
            className="ps-10 pe-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-64"
            placeholder="חיפוש IMEI, SKU, שם..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => openAdd(tab === 'accessory' ? 'accessory' : 'phone')}
          className="bg-primary text-on-primary font-label-lg text-label-lg px-2 sm:px-md py-sm rounded-lg hover:opacity-90 flex items-center gap-xs"
        >
          <Icon name="add" className="text-[18px]" />
          <span className="hidden sm:inline">הוספת פריט</span>
        </button>
      </TopNav>

      <main className="page-main">
        <div className="max-w-7xl mx-auto space-y-lg">
          <div className="sm:hidden relative">
            <Icon name="search" className="absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
            <input
              className="w-full ps-10 pe-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="חיפוש IMEI, SKU, שם..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {alerts.length > 0 && (
            <div className="bg-error-container/30 border border-error-container rounded-xl p-md flex items-start gap-md">
              <Icon name="inventory_2" className="text-error mt-0.5" />
              <div>
                <p className="font-label-lg text-label-lg text-on-error-container">
                  {alerts.length} פריטים במלאי נמוך
                </p>
                <p className="font-body-sm text-body-sm text-secondary mt-xs">
                  {alerts.map((a) => a.name).join(' • ')}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
            {[
              { label: 'טלפונים', value: stats.phones, accent: 'bg-primary' },
              { label: 'במלאי', value: stats.inStock, accent: 'bg-[#059669]' },
              { label: 'אביזרים', value: stats.accessories, accent: 'bg-secondary-fixed' },
              { label: 'מלאי נמוך', value: stats.lowStock, accent: 'bg-tertiary-container' },
            ].map((s) => (
              <div key={s.label} className="bg-surface-container-lowest p-md rounded border border-outline-variant relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.accent}`} />
                <p className="font-label-md text-label-md text-secondary">{s.label}</p>
                <p className="font-display-lg text-display-lg text-on-surface">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-md">
              <div>
                <h3 className="font-title-sm text-title-sm text-on-surface flex items-center gap-sm">
                  <Icon name="bolt" className="text-primary" />
                  כפתורי מכירה מהירה בקופה
                </h3>
                <p className="font-body-sm text-secondary mt-xs">
                  בחר עד {MAX_QUICK_ADD} פריטים — יופיעו בדף הקופה תחת &quot;הוספה מהירה&quot;
                </p>
              </div>
              <span className="font-label-md text-secondary">
                {quickAddProducts.length}/{MAX_QUICK_ADD} נבחרו
              </span>
            </div>
            {quickAddMsg && (
              <p className="font-body-sm text-error mb-md">{quickAddMsg}</p>
            )}
            {quickAddProducts.length === 0 ? (
              <p className="font-body-sm text-secondary text-center py-6 border border-dashed border-outline-variant rounded-lg">
                אין כפתורים — לחץ על ⚡ בטבלה להוספת אביזר למכירה מהירה
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-sm">
                {quickAddProducts.map((p, i) => (
                  <div
                    key={p.id}
                    className="relative flex flex-col items-center justify-center p-sm bg-surface border border-primary/30 rounded-lg min-h-[88px] group"
                  >
                    <div className="absolute top-1 left-1 flex flex-col gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => moveQuickAdd(p, 'up')}
                        className="p-0.5 rounded bg-surface-container-high disabled:opacity-30"
                        aria-label="הזז למעלה"
                      >
                        <Icon name="keyboard_arrow_up" className="text-[14px]" />
                      </button>
                      <button
                        type="button"
                        disabled={i === quickAddProducts.length - 1}
                        onClick={() => moveQuickAdd(p, 'down')}
                        className="p-0.5 rounded bg-surface-container-high disabled:opacity-30"
                        aria-label="הזז למטה"
                      >
                        <Icon name="keyboard_arrow_down" className="text-[14px]" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleQuickAdd(p)}
                      className="absolute top-1 right-1 p-1 rounded-full text-error hover:bg-error-container opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity min-h-[28px] min-w-[28px] flex items-center justify-center"
                      aria-label="הסר"
                    >
                      <Icon name="close" className="text-[14px]" />
                    </button>
                    <Icon name={getQuickAddIconName(p.category)} className="text-primary mb-xs text-[20px]" />
                    <span className="font-label-md text-center text-on-surface line-clamp-2 text-[11px]">
                      {p.name}
                    </span>
                    <span className="font-data-mono text-[10px] text-secondary mt-xs">
                      {formatCurrency(p.sellPrice)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-sm border-b border-outline-variant overflow-x-auto scrollbar-hide -mx-1 px-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`px-md py-sm font-label-lg text-label-lg border-b-2 transition-colors whitespace-nowrap shrink-0 min-h-[44px] ${
                  tab === t.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-secondary hover:text-on-surface'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-surface-container-lowest rounded border border-outline-variant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-outline-variant bg-surface-container-low">
                    <th className="p-3 sm:p-4 font-label-md text-label-md text-on-surface-variant">מוצר</th>
                    <th className="p-3 sm:p-4 font-label-md text-label-md text-on-surface-variant">מזהה / SKU</th>
                    {showPhoneColumns && (
                      <>
                    <th className="p-3 sm:p-4 font-label-md text-label-md text-on-surface-variant hidden lg:table-cell">ספק</th>
                        <th className="p-3 sm:p-4 font-label-md text-label-md text-on-surface-variant hidden lg:table-cell">נכנס למלאי</th>
                      </>
                    )}
                    <th className="p-3 sm:p-4 font-label-md text-label-md text-on-surface-variant">מלאי</th>
                    <th className="p-3 sm:p-4 font-label-md text-label-md text-on-surface-variant text-right hidden sm:table-cell">קנייה</th>
                    <th className="p-3 sm:p-4 font-label-md text-label-md text-on-surface-variant text-right">מכירה</th>
                    <th className="p-3 sm:p-4 font-label-md text-label-md text-on-surface-variant text-right hidden md:table-cell">רווח</th>
                    <th className="p-3 sm:p-4 font-label-md text-label-md text-on-surface-variant text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm">
                  {loading ? (
                    <tr><td colSpan={showPhoneColumns ? 9 : 7} className="p-8 text-center text-secondary">טוען...</td></tr>
                  ) : products.length === 0 ? (
                    <tr><td colSpan={showPhoneColumns ? 9 : 7} className="p-8 text-center text-secondary">לא נמצאו מוצרים</td></tr>
                  ) : (
                    products.map((p, i) => (
                      <tr
                        key={p.id}
                        className={`border-b border-outline-variant hover:bg-surface-container-low transition-colors ${i % 2 ? 'bg-surface-container-low/50' : ''}`}
                      >
                        <td className="p-3 sm:p-4">
                          <div className="font-label-lg text-label-lg text-on-surface">{p.name}</div>
                          {p.productType === 'phone' && (
                            <>
                              <div className="text-secondary text-[12px]">{p.make} {p.model}</div>
                              <div className="lg:hidden text-secondary text-[11px] mt-0.5">
                                {p.supplier ? `${p.supplier} · ` : ''}
                                {formatDateHe(p.stockEnteredAt || p.createdAt)}
                              </div>
                            </>
                          )}
                          {p.productType === 'accessory' && (
                            <div className="text-secondary text-[12px]">{p.category}</div>
                          )}
                        </td>
                        <td className="p-3 sm:p-4 font-data-mono text-data-mono text-secondary text-[12px] sm:text-body-sm">
                          {p.imei || p.sku || p.barcode || '—'}
                        </td>
                        {showPhoneColumns && (
                          <>
                            <td className="p-4 hidden lg:table-cell text-secondary">
                              {p.productType === 'phone' ? p.supplier || '—' : '—'}
                            </td>
                            <td className="p-4 hidden lg:table-cell font-data-mono text-secondary text-[13px]">
                              {p.productType === 'phone' ? formatDateHe(p.stockEnteredAt || p.createdAt) : '—'}
                            </td>
                          </>
                        )}
                        <td className="p-3 sm:p-4"><StockBadge product={p} /></td>
                        <td className="p-3 sm:p-4 text-right font-data-mono hidden sm:table-cell">{formatCurrency(p.buyPrice)}</td>
                        <td className="p-3 sm:p-4 text-right font-data-mono">{formatCurrency(p.sellPrice)}</td>
                        <td className="p-3 sm:p-4 text-right font-data-mono text-[#059669] hidden md:table-cell">
                          {p.profitMarginPercent}%
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center justify-center gap-xs">
                            {p.productType === 'accessory' && (
                              <button
                                type="button"
                                onClick={() => toggleQuickAdd(p)}
                                title={p.isQuickAdd ? 'הסר ממכירה מהירה' : 'הוסף למכירה מהירה'}
                                className={`p-1.5 rounded min-h-[36px] min-w-[36px] flex items-center justify-center ${
                                  p.isQuickAdd
                                    ? 'text-primary bg-primary-container/20'
                                    : 'text-secondary hover:bg-surface-container-high'
                                }`}
                              >
                                <Icon name="bolt" className="text-[18px]" />
                              </button>
                            )}
                            <button type="button" onClick={() => openEdit(p)} className="p-1.5 text-primary hover:bg-secondary-container rounded min-h-[36px] min-w-[36px] flex items-center justify-center">
                              <Icon name="edit" className="text-[18px]" />
                            </button>
                            <button type="button" onClick={() => handleDelete(p)} className="p-1.5 text-error hover:bg-error-container rounded min-h-[36px] min-w-[36px] flex items-center justify-center">
                              <Icon name="delete" className="text-[18px]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'עריכת מוצר' : `הוספת ${form.productType === 'phone' ? 'טלפון' : 'אביזר'}`}
        wide
      >
        {!editing && (
          <div className="flex gap-sm mb-lg">
            <button
              type="button"
              onClick={() => setForm({ ...EMPTY_PHONE, stockEnteredAt: todayDateInput() })}
              className={`flex-1 py-sm rounded-lg font-label-md border ${form.productType === 'phone' ? 'border-primary bg-primary-container/10 text-primary' : 'border-outline-variant text-secondary'}`}
            >
              Phone
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...EMPTY_ACCESSORY })}
              className={`flex-1 py-sm rounded-lg font-label-md border ${form.productType === 'accessory' ? 'border-primary bg-primary-container/10 text-primary' : 'border-outline-variant text-secondary'}`}
            >
              Accessory
            </button>
          </div>
        )}
        <ProductForm
          form={form}
          setForm={setForm}
          isPhone={form.productType === 'phone'}
          isEditing={!!editing}
          supplierSuggestions={supplierSuggestions}
        />
        {error && <p className="text-error font-body-sm mt-md">{error}</p>}
        <div className="flex gap-sm mt-lg justify-end">
          <button type="button" onClick={() => setModalOpen(false)} className="px-md py-sm border border-outline-variant rounded-lg font-label-lg text-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-md py-sm bg-primary text-on-primary rounded-lg font-label-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
