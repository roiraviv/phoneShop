import { useCallback, useEffect, useState } from 'react';
import TopNav from '../components/layout/TopNav';
import Icon from '../components/ui/Icon';
import Modal from '../components/ui/Modal';
import CustomerForm from '../components/crm/CustomerForm';
import ReceiptSlipPreview from '../components/receipt/ReceiptSlipPreview';
import {
  fetchCustomers,
  fetchCustomer,
  createCustomer,
  updateCustomer,
} from '../api/customers';
import { fetchSaleById } from '../api/sales';
import { fetchSettings } from '../api/settings';
import { EMPTY_CUSTOMER_FORM, CUSTOMER_TYPES } from '../constants';
import { formatCurrency, formatDate, getInitials } from '../utils/format';
import { printReceiptSlip } from '../utils/receiptPrint';

function WarrantyCard({ warranty }) {
  const end = new Date(warranty.endDate);
  const active = warranty.isActive && end >= new Date();

  return (
    <div className={`rounded-lg border p-md ${active ? 'border-primary/30 bg-primary-container/5' : 'border-outline-variant bg-surface-container-low opacity-70'}`}>
      <div className="flex justify-between items-start mb-sm">
        <span className={`font-label-md px-sm py-xs rounded-full ${active ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-surface-variant text-on-surface-variant'}`}>
          {active ? 'פעילה' : 'פגה'}
        </span>
        <span className="font-data-mono text-secondary text-[12px]">{warranty.imei}</span>
      </div>
      <p className="font-body-sm text-on-surface">{warranty.coverage}</p>
      <p className="font-body-sm text-secondary mt-xs">
        עד {end.toLocaleDateString('he-IL')}
      </p>
    </div>
  );
}

function InfoItem({ label, value, mono }) {
  if (!value) return null;
  return (
    <div>
      <span className="font-label-md text-label-md text-secondary block mb-xs">{label}</span>
      <span className={`text-on-surface ${mono ? 'font-data-mono' : 'font-body-sm'}`}>{value}</span>
    </div>
  );
}

export default function CRMPage() {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [historyTab, setHistoryTab] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_CUSTOMER_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptTransaction, setReceiptTransaction] = useState(null);
  const [receiptSettings, setReceiptSettings] = useState(null);

  const loadList = useCallback(() => {
    setLoading(true);
    fetchCustomers(search || undefined)
      .then((res) => setCustomers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(loadList, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadList, search]);

  const selectCustomer = async (id) => {
    setDetailLoading(true);
    try {
      const res = await fetchCustomer(id);
      setSelected(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (customers.length > 0 && !selected) {
      selectCustomer(customers[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_CUSTOMER_FORM });
    setError('');
    setModalOpen(true);
  };

  const openEdit = () => {
    if (!selected) return;
    setEditing(selected);
    setForm({
      fullName: selected.fullName || '',
      customerType: selected.customerType || 'private',
      phone: selected.phone || '',
      phone2: selected.phone2 || '',
      nationalId: selected.nationalId || '',
      companyId: selected.companyId || '',
      email: selected.email || '',
      address: selected.address || '',
      city: selected.city || '',
      zip: selected.zip || '',
      notes: selected.notes || '',
    });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.fullName?.trim() || !form.phone?.trim()) {
      setError('שם וטלפון הם שדות חובה');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateCustomer(editing.id, form);
        await selectCustomer(editing.id);
      } else {
        const res = await createCustomer(form);
        await selectCustomer(res.data.id);
      }
      setModalOpen(false);
      loadList();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openPurchaseReceipt = async (item) => {
    if (item.type !== 'purchase') return;
    setReceiptOpen(true);
    setReceiptLoading(true);
    setReceiptTransaction(null);
    try {
      const [saleRes, settingsRes] = await Promise.all([
        fetchSaleById(item.id),
        receiptSettings ? Promise.resolve({ data: receiptSettings }) : fetchSettings(),
      ]);
      setReceiptTransaction(saleRes.data);
      if (!receiptSettings) setReceiptSettings(settingsRes.data);
    } catch (err) {
      console.error(err);
      setReceiptOpen(false);
    } finally {
      setReceiptLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!receiptTransaction) return;
    printReceiptSlip({
      transaction: receiptTransaction,
      settings: receiptSettings,
      customer: selected,
      showCustomerDetails: true,
      taxRate: receiptSettings?.taxRate ?? 0.18,
    });
  };

  const history = selected?.history || [];
  const filteredHistory = history.filter((h) => historyTab === 'all' || h.type === historyTab);
  const activeWarranties = (selected?.warranties || []).filter(
    (w) => w.isActive && new Date(w.endDate) >= new Date()
  );
  const typeLabel = CUSTOMER_TYPES.find((t) => t.value === selected?.customerType)?.label;

  return (
    <div className="page-shell">
      <TopNav title="ניהול לקוחות">
        <button type="button" onClick={openAdd} className="bg-primary text-on-primary font-label-lg px-2 sm:px-md py-sm rounded-lg hover:opacity-90 flex items-center gap-xs">
          <Icon name="person_add" className="text-[18px]" />
          <span className="hidden sm:inline">לקוח חדש</span>
        </button>
      </TopNav>

      <main className="page-scroll-main flex flex-col md:flex-row md:overflow-hidden gap-3 md:gap-4">
        <section className="w-full md:w-[320px] lg:w-[360px] flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden flex-shrink-0 md:max-h-none max-h-[38vh] md:h-auto">
          <div className="p-3 md:p-md border-b border-outline-variant">
            <div className="relative">
              <Icon name="search" className="absolute start-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]" />
              <input
                className="w-full ps-10 pe-md py-sm rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest h-11"
                placeholder="חיפוש: שם, טלפון, ת.ז, ח.פ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-md text-secondary text-center">טוען...</p>
            ) : customers.length === 0 ? (
              <p className="p-md text-secondary text-center">לא נמצאו לקוחות</p>
            ) : (
              customers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCustomer(c.id)}
                  className={`w-full text-start p-md border-b border-outline-variant flex items-center gap-md hover:bg-surface-container-low ${
                    selected?.id === c.id ? 'bg-primary-container/10 border-s-4 border-s-primary' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center font-label-lg flex-shrink-0">
                    {getInitials(c.fullName)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-label-lg text-on-surface truncate">{c.fullName}</p>
                    <p className="font-data-mono text-secondary text-[12px]">{c.phone}</p>
                    {c.nationalId && (
                      <p className="font-data-mono text-secondary text-[11px]">ת.ז: {c.nationalId}</p>
                    )}
                    {c.companyId && (
                      <p className="font-data-mono text-secondary text-[11px]">ח.פ: {c.companyId}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="flex-1 flex flex-col gap-3 md:gap-gutter min-h-0 md:overflow-hidden">
          {detailLoading || !selected ? (
            <div className="flex-1 flex items-center justify-center text-secondary">
              {detailLoading ? 'טוען פרופיל...' : 'בחר לקוח'}
            </div>
          ) : (
            <>
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-3 md:p-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex items-center gap-md sm:gap-lg min-w-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-secondary-container flex items-center justify-center font-headline-md text-xl shrink-0">
                      {getInitials(selected.fullName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-sm">
                        <h3 className="font-headline-md text-on-surface truncate">{selected.fullName}</h3>
                        <span className="font-label-md px-sm py-xs rounded-full bg-secondary-container text-on-secondary-container">
                          {typeLabel}
                        </span>
                      </div>
                      <p className="font-data-mono text-secondary">{selected.phone}</p>
                      {selected.phone2 && <p className="font-data-mono text-secondary text-sm">נוסף: {selected.phone2}</p>}
                    </div>
                  </div>
                  <button type="button" onClick={openEdit} className="w-full sm:w-auto px-md py-sm border border-outline-variant rounded-lg font-label-md text-primary hover:bg-secondary-container flex items-center justify-center gap-xs min-h-[44px] shrink-0">
                    <Icon name="edit" className="text-[16px]" />
                    עריכה
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-md mt-lg pt-lg border-t border-outline-variant">
                  <InfoItem label="ת.ז" value={selected.nationalId} mono />
                  <InfoItem label="ח.פ" value={selected.companyId} mono />
                  <InfoItem label="אימייל" value={selected.email} />
                  <InfoItem label="עיר" value={selected.city} />
                </div>
                <div className="mt-md">
                  <InfoItem label="כתובת" value={[selected.address, selected.city, selected.zip].filter(Boolean).join(', ')} />
                </div>
                {selected.notes && (
                  <div className="mt-md bg-surface-container-low rounded-lg p-sm">
                    <InfoItem label="הערות" value={selected.notes} />
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-md mt-lg pt-lg border-t border-outline-variant">
                  <div>
                    <span className="font-label-md text-secondary block mb-xs">רכישות</span>
                    <span className="font-data-mono text-primary font-bold text-lg">{selected.purchaseHistory?.length || 0}</span>
                  </div>
                  <div>
                    <span className="font-label-md text-secondary block mb-xs">תיקונים</span>
                    <span className="font-data-mono text-primary font-bold text-lg">{selected.repairHistory?.length || 0}</span>
                  </div>
                  <div>
                    <span className="font-label-md text-secondary block mb-xs">אחריות פעילה</span>
                    <span className="font-data-mono text-[#059669] font-bold text-lg">{activeWarranties.length}</span>
                  </div>
                  <div>
                    <span className="font-label-md text-secondary block mb-xs">לקוח מאז</span>
                    <span className="font-body-sm">{formatDate(selected.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter flex-1 md:overflow-hidden min-h-0">
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col overflow-hidden min-h-[200px] max-h-[50vh] lg:max-h-none">
                  <div className="p-md border-b border-outline-variant flex items-center gap-sm">
                    <Icon name="verified_user" className="text-primary" />
                    <h4 className="font-title-sm text-on-surface">אחריות (IMEI)</h4>
                  </div>
                  <div className="flex-1 overflow-y-auto p-md space-y-sm">
                    {(selected.warranties || []).length === 0 ? (
                      <p className="text-secondary text-center py-8">אין אחריות רשומה</p>
                    ) : (
                      selected.warranties.map((w) => (
                        <WarrantyCard key={w.id || w.imei + w.startDate} warranty={w} />
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col overflow-hidden min-h-[200px] max-h-[50vh] lg:max-h-none">
                  <div className="p-md border-b border-outline-variant">
                    <div className="flex items-center gap-sm mb-md">
                      <Icon name="history" className="text-secondary" />
                      <h4 className="font-title-sm text-on-surface">היסטוריה</h4>
                    </div>
                    <div className="flex gap-sm">
                      {[
                        { key: 'all', label: 'הכל' },
                        { key: 'purchase', label: 'רכישות' },
                        { key: 'repair', label: 'תיקונים' },
                      ].map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setHistoryTab(t.key)}
                          className={`px-sm py-xs rounded-full font-label-md ${
                            historyTab === t.key ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-low text-secondary'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-md space-y-sm">
                    {filteredHistory.length === 0 ? (
                      <p className="text-secondary text-center py-8">אין היסטוריה</p>
                    ) : (
                      filteredHistory.map((item) => (
                        <div
                          key={`${item.type}-${item.id}`}
                          className={`bg-surface rounded-lg border border-outline-variant p-md flex justify-between items-center ${
                            item.type === 'purchase' ? 'hover:border-primary/40 hover:bg-primary-container/5 transition-colors' : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            {item.type === 'purchase' ? (
                              <button
                                type="button"
                                onClick={() => openPurchaseReceipt(item)}
                                className="text-start w-full group"
                              >
                                <div className="flex items-center gap-sm">
                                  <Icon name="shopping_bag" className="text-[16px] text-primary" />
                                  <span className="font-label-lg text-on-surface group-hover:text-primary transition-colors truncate">
                                    {item.items}
                                  </span>
                                  <Icon name="receipt_long" className="text-[16px] text-secondary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                </div>
                                <p className="font-body-sm text-secondary mt-xs">
                                  {formatDate(item.date)}
                                  {item.transactionNumber && ` • ${item.transactionNumber}`}
                                </p>
                              </button>
                            ) : (
                              <>
                                <div className="flex items-center gap-sm">
                                  <Icon name="build" className="text-[16px] text-secondary" />
                                  <span className="font-label-lg text-on-surface">{item.items}</span>
                                </div>
                                <p className="font-body-sm text-secondary mt-xs">
                                  {formatDate(item.date)}
                                  {item.ticketNumber && ` • ${item.ticketNumber}`}
                                </p>
                              </>
                            )}
                          </div>
                          <span className="font-data-mono text-on-surface flex-shrink-0 mr-md">{formatCurrency(item.total)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'עריכת לקוח' : 'לקוח חדש'} wide>
        <CustomerForm form={form} setForm={setForm} />
        {error && <p className="text-error font-body-sm mt-md">{error}</p>}
        <div className="flex gap-sm mt-lg justify-end">
          <button type="button" onClick={() => setModalOpen(false)} className="px-md py-sm border border-outline-variant rounded-lg font-label-lg text-secondary">
            ביטול
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="px-md py-sm bg-primary text-on-primary rounded-lg font-label-lg disabled:opacity-50">
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </Modal>

      <Modal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        title={receiptTransaction?.transactionNumber ? `קבלה ${receiptTransaction.transactionNumber}` : 'קבלה'}
      >
        {receiptLoading ? (
          <p className="text-center text-secondary py-12">טוען קבלה...</p>
        ) : receiptTransaction ? (
          <div className="space-y-lg">
            <ReceiptSlipPreview
              transaction={receiptTransaction}
              settings={receiptSettings}
              customer={selected}
              taxRate={receiptSettings?.taxRate ?? 0.18}
            />
            <div className="flex gap-sm justify-end">
              <button
                type="button"
                onClick={() => setReceiptOpen(false)}
                className="px-md py-sm border border-outline-variant rounded-lg font-label-lg text-secondary"
              >
                סגור
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="px-md py-sm bg-primary text-on-primary rounded-lg font-label-lg flex items-center gap-xs"
              >
                <Icon name="print" className="text-[18px]" />
                הדפס קבלה
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-secondary py-12">לא נמצאה עסקה</p>
        )}
      </Modal>
    </div>
  );
}
