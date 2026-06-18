import { useEffect, useState } from 'react';
import TopNav from '../components/layout/TopNav';
import Icon from '../components/ui/Icon';
import Modal from '../components/ui/Modal';
import RepairForm from '../components/repair/RepairForm';
import RepairDetailModal from '../components/repair/RepairDetailModal';
import { fetchRepairs, createRepair, updateRepair } from '../api/repairs';
import { fetchCustomers } from '../api/customers';
import { fetchSettings } from '../api/settings';
import { REPAIR_COLUMNS, EMPTY_REPAIR_FORM } from '../constants';
import { formatCurrency } from '../utils/format';

const PRIORITY_STYLES = {
  high: 'bg-error-container text-on-error-container',
  medium: 'bg-surface-variant text-on-surface-variant',
  low: 'bg-surface-variant text-on-surface-variant',
};

function RepairCard({ repair, onOpen }) {
  const priority = repair.priority || 'medium';
  const hasCode = repair.devicePassword || repair.simPin;

  return (
    <div
      className={`bg-surface-container-lowest border rounded-xl p-md shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        repair.status === 'בעבודה' ? 'border-primary/30 relative overflow-hidden' : 'border-outline-variant'
      }`}
      onClick={() => onOpen(repair)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(repair)}
      role="button"
      tabIndex={0}
    >
      {repair.status === 'בעבודה' && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
      )}
      <div className={`flex justify-between items-start mb-sm ${repair.status === 'בעבודה' ? 'pl-xs' : ''}`}>
        <span className={`font-label-md text-label-md px-xs py-unit rounded flex items-center gap-1 ${PRIORITY_STYLES[priority]}`}>
          {priority === 'high' && <Icon name="priority_high" className="text-[14px]" />}
          {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </span>
        <div className="flex items-center gap-xs">
          {hasCode && <Icon name="lock" className="text-error text-[14px]" title="יש קוד מכשיר" />}
          <span className="font-data-mono text-data-mono text-secondary text-[12px]">
            #{repair.ticketNumber}
          </span>
        </div>
      </div>
      <h4 className={`font-label-lg text-label-lg text-on-surface mb-xs ${repair.status === 'בעבודה' ? 'pl-xs' : ''}`}>
        {repair.customerName}
      </h4>
      <p className={`font-body-sm text-body-sm text-secondary mb-xs ${repair.status === 'תוקן' ? 'line-through' : ''} ${repair.status === 'בעבודה' ? 'pl-xs' : ''}`}>
        {repair.deviceModel} - {repair.issueDescription}
      </p>
      {repair.imei && (
        <p className={`font-data-mono text-data-mono text-secondary text-[11px] mb-md ${repair.status === 'בעבודה' ? 'pl-xs' : ''}`}>
          IMEI: {repair.imei}
        </p>
      )}

      {repair.status === 'ממתין לחלקים' && repair.partNote && (
        <div className="flex items-start gap-sm mb-md bg-[#fffbeb] p-sm rounded border border-[#fde68a]">
          <Icon name="local_shipping" className="text-[16px] text-[#d97706] mt-0.5" />
          <p className="font-label-md text-label-md text-[#92400e]">{repair.partNote}</p>
        </div>
      )}

      {repair.status === 'בעבודה' && (
        <div className="flex items-center gap-sm mb-md pl-xs text-primary font-label-md text-label-md">
          <Icon name="build_circle" className="text-[16px] animate-pulse" />
          <span>בעבודה</span>
        </div>
      )}

      <div className={`border-t border-outline-variant pt-sm mt-sm flex justify-between items-center ${repair.status === 'בעבודה' ? 'pl-xs' : ''}`}>
        <div className="w-6 h-6 rounded-full bg-surface-variant border border-surface flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
          {repair.customerName?.[0] || 'U'}
        </div>
        <div className="text-right">
          <p className="font-label-md text-label-md text-secondary text-[10px] uppercase">
            {repair.status === 'תוקן' ? 'רווח סופי' : 'רווח משוער'}
          </p>
          <p className="font-data-mono text-data-mono text-[#059669]">
            {formatCurrency(repair.profit)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RepairLabPage() {
  const [repairs, setRepairs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailRepair, setDetailRepair] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_REPAIR_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    fetchRepairs()
      .then((res) => setRepairs(res.data.filter((r) => r.status !== 'נמסר')))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetchCustomers().then((res) => setCustomers(res.data)).catch(console.error);
  }, []);

  const openNewRepair = async () => {
    try {
      const settings = await fetchSettings();
      setForm({
        ...EMPTY_REPAIR_FORM,
        laborCharge: String(settings.data.repairDefaultLaborCharge || 50),
      });
    } catch {
      setForm({ ...EMPTY_REPAIR_FORM });
    }
    setError('');
    setFormOpen(true);
  };

  const handleCreate = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        partCost: Number(form.partCost) || 0,
        laborCharge: Number(form.laborCharge) || 0,
        finalCustomerPrice: Number(form.finalCustomerPrice),
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      };
      await createRepair(payload);
      setFormOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await updateRepair(id, { status });
      load();
      if (detailRepair?.id === id) {
        setDetailRepair(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = repairs.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.ticketNumber?.toLowerCase().includes(q) ||
      r.deviceModel?.toLowerCase().includes(q) ||
      r.customerName?.toLowerCase().includes(q) ||
      r.imei?.includes(q) ||
      r.serialNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-shell">
      <TopNav title="מעבדת תיקונים">
        <div className="relative hidden sm:block">
          <Icon name="search" className="absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
          <input
            className="ps-10 pe-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-64"
            placeholder="חיפוש תיקון, IMEI, לקוח..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={openNewRepair}
          className="bg-primary text-on-primary font-label-lg px-2 sm:px-md py-sm rounded-lg hover:opacity-90 flex items-center gap-xs"
        >
          <Icon name="add" className="text-[18px]" />
          <span className="hidden sm:inline">תיקון חדש</span>
        </button>
      </TopNav>

      <main className="page-scroll-main flex flex-col md:overflow-hidden md:p-8">
        <div className="sm:hidden relative mb-3 shrink-0">
          <Icon name="search" className="absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
          <input
            className="w-full ps-10 pe-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg font-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="חיפוש תיקון, IMEI, לקוח..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="flex items-center justify-center flex-1 text-secondary">טוען תיקונים...</div>
        ) : (
          <div className="flex flex-1 gap-3 md:gap-lg min-w-0 overflow-x-auto overflow-y-hidden scrollbar-hide pb-1 -mx-1 px-1">
            {REPAIR_COLUMNS.map((col, colIdx) => {
              const cards = filtered.filter((r) => r.status === col.key);
              const highlighted = colIdx === 1 || colIdx === 2;

              return (
                <section
                  key={col.key}
                  className={`flex flex-col w-[min(85vw,280px)] sm:w-[320px] h-full flex-shrink-0 ${
                    highlighted ? 'bg-surface-container/30 rounded-xl p-sm border border-transparent' : ''
                  }`}
                >
                  <div className={`flex items-center justify-between mb-md px-sm ${highlighted ? 'pt-sm' : ''}`}>
                    <div className="flex items-center gap-sm">
                      <h3 className="font-title-sm text-title-sm text-on-surface">{col.label}</h3>
                      <span className={`font-data-mono px-2 py-0.5 rounded-full text-[12px] ${col.badge}`}>
                        {cards.length}
                      </span>
                    </div>
                  </div>
                  <div className={`flex-1 overflow-y-auto space-y-md pb-xl scrollbar-hide ${highlighted ? 'px-xs' : ''}`}>
                    {cards.map((repair) => (
                      <RepairCard key={repair.id} repair={repair} onOpen={setDetailRepair} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="פתיחת תיקון חדש" wide>
        <RepairForm form={form} setForm={setForm} customers={customers} />
        {error && <p className="text-error font-body-sm mt-md">{error}</p>}
        <div className="flex gap-sm mt-lg justify-end">
          <button type="button" onClick={() => setFormOpen(false)} className="px-md py-sm border border-outline-variant rounded-lg font-label-lg text-secondary">
            ביטול
          </button>
          <button type="button" onClick={handleCreate} disabled={saving} className="px-md py-sm bg-primary text-on-primary rounded-lg font-label-lg disabled:opacity-50">
            {saving ? 'שומר...' : 'פתח תיקון'}
          </button>
        </div>
      </Modal>

      <RepairDetailModal
        repair={detailRepair}
        open={!!detailRepair}
        onClose={() => setDetailRepair(null)}
        onStatusChange={handleStatusUpdate}
      />
    </div>
  );
}
