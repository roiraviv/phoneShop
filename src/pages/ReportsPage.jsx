import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopNav from '../components/layout/TopNav';
import Icon from '../components/ui/Icon';
import { fetchSalesReport, fetchInventoryReport } from '../api/analytics';
import { formatCurrency, formatDateHe } from '../utils/format';
import {
  exportSalesReportCsv,
  printSalesReport,
  exportInventoryReportCsv,
  printInventoryReport,
} from '../utils/reportExport';

const REPORT_TABS = [
  { key: 'sales', label: 'מכירות לפי פריט' },
  { key: 'inventory', label: 'מלאי סוף שנה' },
];

const SORT_OPTIONS = [
  { value: 'quantity', label: 'כמות שנמכרה' },
  { value: 'revenue', label: 'הכנסות' },
  { value: 'profit', label: 'רווח' },
];

const PERIOD_PRESETS = [
  { key: 'today', label: 'היום' },
  { key: 'week', label: 'השבוע' },
  { key: 'month', label: 'החודש' },
  { key: '30d', label: '30 יום' },
  { key: 'custom', label: 'מותאם' },
];

function toInputDate(d) {
  return d.toISOString().slice(0, 10);
}

function getPresetRange(key) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();

  switch (key) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week': {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case '30d':
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
  }

  return { start: start.toISOString(), end: end.toISOString() };
}

function KpiCard({ label, value, accent = 'bg-primary' }) {
  return (
    <div className="bg-surface-container-lowest p-lg rounded border border-outline-variant relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent}`} />
      <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">{label}</p>
      <h3 className="font-display-lg text-display-lg text-on-surface">{value}</h3>
    </div>
  );
}

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'inventory' ? 'inventory' : 'sales';

  const [preset, setPreset] = useState('month');
  const [startDate, setStartDate] = useState(() => toInputDate(new Date(new Date().setDate(1))));
  const [endDate, setEndDate] = useState(() => toInputDate(new Date()));
  const [sortBy, setSortBy] = useState('quantity');
  const [report, setReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [inventoryAsOf, setInventoryAsOf] = useState(() => toInputDate(new Date()));
  const [loading, setLoading] = useState(true);
  const [showUnsold, setShowUnsold] = useState(false);
  const [showOpenRepairs, setShowOpenRepairs] = useState(false);

  const loadSalesReport = useCallback(() => {
    setLoading(true);
    const start = preset === 'custom'
      ? new Date(startDate).toISOString()
      : getPresetRange(preset).start;
    const end = preset === 'custom'
      ? new Date(`${endDate}T23:59:59`).toISOString()
      : getPresetRange(preset).end;

    fetchSalesReport({ startDate: start, endDate: end, sortBy })
      .then((res) => setReport(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [preset, startDate, endDate, sortBy]);

  const loadInventoryReport = useCallback(() => {
    setLoading(true);
    const asOf = new Date(`${inventoryAsOf}T23:59:59`).toISOString();
    fetchInventoryReport(asOf)
      .then((res) => setInventoryReport(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [inventoryAsOf]);

  useEffect(() => {
    if (tab === 'sales') loadSalesReport();
    else loadInventoryReport();
  }, [tab, loadSalesReport, loadInventoryReport]);

  const handlePreset = (key) => {
    setPreset(key);
    if (key !== 'custom') {
      const { start, end } = getPresetRange(key);
      setStartDate(toInputDate(new Date(start)));
      setEndDate(toInputDate(new Date(end)));
    }
  };

  const summary = report?.summary;
  const items = report?.items || [];
  const unsold = report?.unsoldInInventory || [];
  const invSummary = inventoryReport?.summary;

  return (
    <div className="page-shell">
      <TopNav title="דוחות פיננסיים" />
      <main className="page-main">
        <div className="max-w-7xl mx-auto space-y-lg">
          <div className="flex gap-sm border-b border-outline-variant overflow-x-auto scrollbar-hide -mx-1 px-1">
            {REPORT_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setSearchParams(t.key === 'sales' ? {} : { tab: t.key })}
                className={`px-md py-sm font-label-lg border-b-2 transition-colors whitespace-nowrap shrink-0 min-h-[44px] ${
                  tab === t.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-secondary hover:text-on-surface'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'sales' ? (
            <>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">מכירות לפי פריט</h2>
              <p className="font-body-sm text-secondary mt-1">
                דוח שמחבר בין עסקאות למלאי – כמה נמכר, מה הרווח, ומה נשאר במחסן
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => exportSalesReportCsv(report)}
                disabled={!report || loading}
                className="px-md py-2 bg-surface-container-lowest border border-outline font-label-lg text-label-lg rounded hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                ייצוא Excel
              </button>
              <button
                type="button"
                onClick={() => printSalesReport(report)}
                disabled={!report || loading}
                className="px-md py-2 bg-primary text-on-primary font-label-lg text-label-lg rounded hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50"
              >
                ייצוא PDF
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-lg rounded border border-outline-variant flex flex-col lg:flex-row flex-wrap gap-4 items-end">
            <div className="flex flex-wrap gap-2">
              {PERIOD_PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handlePreset(p.key)}
                  className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                    preset === p.key
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {preset === 'custom' && (
              <div className="flex flex-wrap gap-3 items-center">
                <label className="font-label-md text-secondary">
                  מ-
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mr-2 px-3 py-1.5 border border-outline-variant rounded-lg bg-surface-container-low"
                  />
                </label>
                <label className="font-label-md text-secondary">
                  עד
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mr-2 px-3 py-1.5 border border-outline-variant rounded-lg bg-surface-container-low"
                  />
                </label>
              </div>
            )}

            <div className="flex items-center gap-2 mr-auto lg:mr-0">
              <span className="font-label-md text-secondary">מיון לפי:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 border border-outline-variant rounded-lg bg-surface-container-low font-body-sm"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {preset === 'custom' && (
              <button
                type="button"
                onClick={loadSalesReport}
                className="px-md py-2 bg-primary text-on-primary rounded-lg font-label-lg"
              >
                החל
              </button>
            )}
          </div>

          {report?.period && (
            <p className="font-body-sm text-secondary">
              תקופה: {formatDateHe(report.period.from)} – {formatDateHe(report.period.to)}
              {' · '}{summary?.transactionCount ?? 0} עסקאות
            </p>
          )}

          {loading ? (
            <div className="text-center py-16 text-secondary">טוען דוח...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
                <KpiCard label="הכנסות" value={formatCurrency(summary?.grossRevenue)} />
                <KpiCard label="רווח" value={formatCurrency(summary?.totalProfit)} accent="bg-secondary-fixed" />
                <KpiCard
                  label="יחידות שנמכרו"
                  value={String(summary?.totalQuantitySold ?? 0)}
                  accent="bg-tertiary-container"
                />
                <KpiCard
                  label="מרווח ממוצע"
                  value={`${summary?.profitMarginPercent ?? 0}%`}
                  accent="bg-primary-container"
                />
              </div>

              <div className="bg-surface-container-lowest rounded border border-outline-variant overflow-hidden">
                <div className="p-lg border-b border-outline-variant">
                  <h3 className="font-title-sm text-title-sm text-on-surface">דירוג מכירות</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-outline-variant bg-surface-container-low">
                        <th className="p-4 font-label-md text-on-surface-variant">#</th>
                        <th className="p-4 font-label-md text-on-surface-variant">פריט</th>
                        <th className="p-4 font-label-md text-on-surface-variant">סוג</th>
                        <th className="p-4 font-label-md text-on-surface-variant">מזהה</th>
                        <th className="p-4 font-label-md text-on-surface-variant text-right">כמות</th>
                        <th className="p-4 font-label-md text-on-surface-variant text-right">הכנסות</th>
                        <th className="p-4 font-label-md text-on-surface-variant text-right">רווח</th>
                        <th className="p-4 font-label-md text-on-surface-variant text-right">מרווח</th>
                        <th className="p-4 font-label-md text-on-surface-variant">מלאי</th>
                      </tr>
                    </thead>
                    <tbody className="font-body-sm">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-secondary">
                            אין מכירות בתקופה שנבחרה
                          </td>
                        </tr>
                      ) : (
                        items.map((item, i) => (
                          <tr
                            key={`${item.referenceId}-${item.name}-${i}`}
                            className={`border-b border-outline-variant hover:bg-surface transition-colors ${i % 2 ? 'bg-surface-container-low/50' : ''}`}
                          >
                            <td className="p-4 text-secondary font-bold">{item.rank}</td>
                            <td className="p-4 text-on-surface font-medium max-w-[200px] truncate">{item.name}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-secondary text-xs">
                                {item.itemTypeLabel}
                              </span>
                            </td>
                            <td className="p-4 text-secondary font-data-mono text-data-mono text-xs">
                              {item.identifier || '—'}
                            </td>
                            <td className="p-4 text-right font-bold text-on-surface">{item.quantitySold}</td>
                            <td className="p-4 text-right font-data-mono text-data-mono">
                              {formatCurrency(item.revenue)}
                            </td>
                            <td className="p-4 text-right font-data-mono text-data-mono text-emerald-700">
                              {formatCurrency(item.profit)}
                            </td>
                            <td className="p-4 text-right text-secondary">{item.profitMarginPercent}%</td>
                            <td className="p-4 text-secondary text-xs">
                              {item.currentStock != null
                                ? `${item.currentStock} יח'`
                                : item.stockStatus || (item.inInventory ? 'במלאי' : '—')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {unsold.length > 0 && (
                <div className="bg-surface-container-lowest rounded border border-outline-variant overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowUnsold((v) => !v)}
                    className="w-full p-lg border-b border-outline-variant flex justify-between items-center hover:bg-surface-container-low transition-colors"
                  >
                    <h3 className="font-title-sm text-title-sm text-on-surface">
                      פריטים במלאי ללא מכירות בתקופה ({unsold.length})
                    </h3>
                    <Icon name={showUnsold ? 'expand_less' : 'expand_more'} />
                  </button>
                  {showUnsold && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-outline-variant bg-surface-container-low">
                            <th className="p-4 font-label-md text-on-surface-variant">פריט</th>
                            <th className="p-4 font-label-md text-on-surface-variant">סוג</th>
                            <th className="p-4 font-label-md text-on-surface-variant">מזהה</th>
                            <th className="p-4 font-label-md text-on-surface-variant">מלאי</th>
                            <th className="p-4 font-label-md text-on-surface-variant text-right">מחיר מחירון</th>
                          </tr>
                        </thead>
                        <tbody className="font-body-sm">
                          {unsold.map((p) => (
                            <tr key={p.id} className="border-b border-outline-variant">
                              <td className="p-4 text-on-surface">{p.name}</td>
                              <td className="p-4 text-secondary">{p.itemTypeLabel}</td>
                              <td className="p-4 text-secondary font-data-mono text-xs">{p.identifier || '—'}</td>
                              <td className="p-4 text-secondary">
                                {p.currentStock != null ? `${p.currentStock} יח'` : p.stockStatus || '—'}
                              </td>
                              <td className="p-4 text-right font-data-mono">{formatCurrency(p.catalogSellPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
            </>
          ) : (
            <>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                    מלאי סוף שנה {inventoryReport?.year || new Date().getFullYear()}
                  </h2>
                  <p className="font-body-sm text-secondary mt-1">
                    רשימת מלאי מלאה לסגירת שנה — טלפונים, אביזרים ותיקונים פתוחים
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => exportInventoryReportCsv(inventoryReport)}
                    disabled={!inventoryReport || loading}
                    className="px-md py-2 bg-surface-container-lowest border border-outline font-label-lg rounded hover:bg-surface-container-low disabled:opacity-50"
                  >
                    ייצוא Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => printInventoryReport(inventoryReport)}
                    disabled={!inventoryReport || loading}
                    className="px-md py-2 bg-primary text-on-primary font-label-lg rounded hover:bg-primary-container shadow-sm disabled:opacity-50"
                  >
                    ייצוא PDF
                  </button>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-lg rounded border border-outline-variant flex flex-wrap gap-4 items-end">
                <label className="font-label-md text-secondary">
                  נכון לתאריך
                  <input
                    type="date"
                    value={inventoryAsOf}
                    onChange={(e) => setInventoryAsOf(e.target.value)}
                    className="mr-2 px-3 py-1.5 border border-outline-variant rounded-lg bg-surface-container-low block mt-1"
                  />
                </label>
                <button
                  type="button"
                  onClick={loadInventoryReport}
                  className="px-md py-2 bg-primary text-on-primary rounded-lg font-label-lg"
                >
                  רענן דוח
                </button>
              </div>

              {loading ? (
                <div className="text-center py-16 text-secondary">טוען דוח מלאי...</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-gutter">
                    <KpiCard label="טלפונים במלאי" value={String(invSummary?.phoneCount ?? 0)} />
                    <KpiCard label="יחידות אביזרים" value={String(invSummary?.accessoryUnits ?? 0)} accent="bg-secondary-fixed" />
                    <KpiCard label="שווי מכירה כולל" value={formatCurrency(invSummary?.totalSellValue)} accent="bg-tertiary-container" />
                    <KpiCard label="שווי קנייה כולל" value={formatCurrency(invSummary?.totalBuyValue)} />
                    <KpiCard label="רווח פוטנציאלי" value={formatCurrency(invSummary?.totalPotentialProfit)} accent="bg-primary-container" />
                    <KpiCard label="תיקונים פתוחים" value={String(invSummary?.openRepairsCount ?? 0)} />
                  </div>

                  <InventoryTable
                    title={`טלפונים במלאי (${inventoryReport?.phones?.length ?? 0})`}
                    headers={['שם', 'דגם', 'IMEI', 'ספק', 'עלות', 'מכירה', 'רווח']}
                    rows={(inventoryReport?.phones || []).map((p) => [
                      p.name,
                      `${p.make || ''} ${p.model || ''}`.trim(),
                      p.imei,
                      p.supplier || '—',
                      formatCurrency(p.buyPrice),
                      formatCurrency(p.sellPrice),
                      formatCurrency(p.profit),
                    ])}
                  />

                  <InventoryTable
                    title={`אביזרים במלאי (${inventoryReport?.accessories?.length ?? 0} פריטים)`}
                    headers={['שם', 'SKU', 'קטגוריה', 'כמות', 'שווי קנייה', 'שווי מכירה', 'רווח']}
                    rows={(inventoryReport?.accessories || []).map((p) => [
                      p.name,
                      p.sku || '—',
                      p.category,
                      p.stockQuantity,
                      formatCurrency(p.lineBuyValue),
                      formatCurrency(p.lineSellValue),
                      formatCurrency(p.lineProfit),
                    ])}
                  />

                  {(inventoryReport?.openRepairs?.length ?? 0) > 0 && (
                    <div className="bg-surface-container-lowest rounded border border-outline-variant overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowOpenRepairs((v) => !v)}
                        className="w-full p-lg border-b border-outline-variant flex justify-between items-center hover:bg-surface-container-low"
                      >
                        <h3 className="font-title-sm text-on-surface">
                          תיקונים פתוחים ({inventoryReport.openRepairs.length})
                        </h3>
                        <Icon name={showOpenRepairs ? 'expand_less' : 'expand_more'} />
                      </button>
                      {showOpenRepairs && (
                        <InventoryTable
                          bare
                          headers={['מספר', 'מכשיר', 'לקוח', 'סטטוס', 'מחיר']}
                          rows={inventoryReport.openRepairs.map((r) => [
                            r.ticketNumber,
                            r.deviceModel,
                            r.customerName,
                            r.status,
                            formatCurrency(r.finalCustomerPrice),
                          ])}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function InventoryTable({ title, headers, rows, bare = false }) {
  const table = (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-outline-variant bg-surface-container-low">
            {headers.map((h) => (
              <th key={h} className="p-4 font-label-md text-on-surface-variant">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="font-body-sm">
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="p-8 text-center text-secondary">אין פריטים</td></tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className={`border-b border-outline-variant ${i % 2 ? 'bg-surface-container-low/50' : ''}`}>
                {row.map((cell, j) => (
                  <td key={j} className="p-4 text-on-surface">{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  if (bare) return table;

  return (
    <div className="bg-surface-container-lowest rounded border border-outline-variant overflow-hidden">
      <div className="p-lg border-b border-outline-variant">
        <h3 className="font-title-sm text-on-surface">{title}</h3>
      </div>
      {table}
    </div>
  );
}
