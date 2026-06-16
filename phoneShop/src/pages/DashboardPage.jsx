import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/layout/TopNav';
import Icon from '../components/ui/Icon';
import { fetchDashboard, fetchSales } from '../api/analytics';
import { globalSearch } from '../api/search';
import { formatCurrency, formatDate } from '../utils/format';
import { exportTransactionsCsv, printDashboardReport } from '../utils/reportExport';

function KpiCard({ label, value, trend, trendLabel, accent = 'bg-primary' }) {
  return (
    <div className="bg-surface-container-lowest p-lg rounded border border-outline-variant relative overflow-hidden hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)] transition-shadow">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent}`} />
      <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">{label}</p>
      <h3 className="font-display-lg text-display-lg text-on-surface mb-1">{value}</h3>
      {trendLabel && (
        <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-emerald-600' : 'text-secondary'}`}>
          <Icon name={trend === 'up' ? 'trending_up' : 'horizontal_rule'} className="text-[16px]" />
          <span className="font-body-sm text-body-sm font-medium">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}

function ProfitChart({ chart }) {
  if (!chart?.labels?.length) {
    return (
      <div className="flex-1 min-h-[240px] flex items-center justify-center text-secondary font-body-sm">
        אין נתוני גרף עדיין
      </div>
    );
  }

  const revenue = chart.datasets?.[0]?.data || [];
  const profit = chart.datasets?.[1]?.data || [];
  const max = Math.max(...revenue, 1);

  return (
    <div className="flex-1 relative min-h-[240px] flex items-end justify-between px-md pt-4 gap-1">
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-b border-outline-variant w-full h-0 opacity-50" />
        ))}
      </div>
      {chart.labels.map((label, i) => (
        <div key={label} className="flex flex-col items-center gap-2 relative z-10 flex-1 min-w-0">
          <div className="flex items-end gap-1 w-full h-32 justify-center">
            <div
              className="w-1/2 bg-primary-container rounded-t"
              style={{ height: `${(revenue[i] / max) * 100}%`, minHeight: revenue[i] ? '4px' : 0 }}
            />
            <div
              className="w-1/2 bg-secondary-fixed rounded-t"
              style={{ height: `${(profit[i] / max) * 100}%`, minHeight: profit[i] ? '4px' : 0 }}
            />
          </div>
          <span className="font-label-md text-label-md text-secondary truncate w-full text-center text-[10px]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function BreakdownChart({ breakdown }) {
  const details = breakdown?.details || [];
  const total = details.reduce((s, d) => s + d.profit, 0) || 1;
  const colors = ['stroke-primary-container', 'stroke-tertiary-container', 'stroke-secondary'];
  let offset = 0;
  const circumference = 157;

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative">
      <svg className="w-48 h-48 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" fill="transparent" r="25" stroke="#f2f4f6" strokeWidth="50" />
        {details.map((item, i) => {
          const dash = (item.profit / total) * circumference;
          const circle = (
            <circle
              key={item.category}
              className={colors[i % colors.length]}
              cx="50"
              cy="50"
              fill="transparent"
              r="25"
              strokeWidth="50"
              strokeDasharray={`${dash} ${circumference}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 bg-surface-container-lowest rounded-full flex flex-col items-center justify-center shadow-[inset_0px_2px_4px_rgba(0,0,0,0.05)]">
          <span className="font-title-sm text-title-sm text-on-surface">סה&quot;כ</span>
          <span className="font-label-md text-label-md text-secondary">100%</span>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3 w-full">
        {details.map((item, i) => (
          <div key={item.category} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${['bg-primary-container', 'bg-tertiary-container', 'bg-secondary'][i % 3]}`} />
              <span className="font-label-md text-label-md text-on-surface">{item.category}</span>
            </div>
            <span className="font-data-mono text-data-mono">
              {Math.round((item.profit / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([fetchDashboard(), fetchSales({ limit: 5 }), fetchSales({ limit: 100 })])
      .then(([dashRes, salesRes, allSalesRes]) => {
        setDashboard(dashRes.data);
        setTransactions(salesRes.data || []);
        setAllTransactions(allSalesRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const runSearch = useCallback((q) => {
    if (q.length < 2) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    globalSearch(q)
      .then((res) => setSearchResults(res.data))
      .catch(console.error)
      .finally(() => setSearchLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, runSearch]);

  const handleSearchResult = (type, item) => {
    setSearchQuery('');
    setSearchResults(null);
    if (type === 'product') navigate('/inventory');
    else if (type === 'customer') navigate('/crm');
    else if (type === 'repair') navigate('/repairs');
  };

  const handleExport = () => {
    setExporting(true);
    try {
      exportTransactionsCsv(allTransactions);
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateReport = () => {
    printDashboardReport({ dashboard, transactions: allTransactions });
  };

  const month = dashboard?.summary?.thisMonth;
  const repairs = dashboard?.alerts?.lowStockCount ?? 0;
  const activeRepairs = dashboard?.summary?.thisMonth?.repairSalesCount ?? 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-secondary">
        טוען דשבורד...
      </div>
    );
  }

  return (
    <div className="page-shell">
      <TopNav
        title="דשבורד – חנות סלולר"
        searchPlaceholder="חיפוש מלאי, IMEI, לקוחות..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        searchLoading={searchLoading}
        onResultClick={handleSearchResult}
      />
      <main className="page-main">
        <div className="max-w-7xl mx-auto space-y-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">סקירה פיננסית</h2>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                type="button"
                disabled={exporting}
                onClick={handleExport}
                className="flex-1 sm:flex-none px-md py-2 bg-surface-container-lowest border border-outline font-label-lg text-label-lg rounded hover:bg-surface-container-low transition-colors disabled:opacity-50 text-center"
              >
                {exporting ? 'מייצא...' : 'ייצוא CSV'}
              </button>
              <button
                type="button"
                onClick={handleGenerateReport}
                className="flex-1 sm:flex-none px-md py-2 bg-primary text-on-primary font-label-lg text-label-lg rounded hover:bg-primary-container transition-colors shadow-sm text-center"
              >
                הפקת דוח
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <KpiCard
              label="הכנסות"
              value={formatCurrency(month?.grossRevenue)}
              trend="up"
              trendLabel="החודש"
            />
            <KpiCard
              label="רווח נקי"
              value={formatCurrency(month?.netProfit)}
              trend="up"
              trendLabel="החודש"
            />
            <KpiCard
              label="מרווח ממוצע"
              value={`${month?.profitMarginPercent ?? 0}%`}
              trend="stable"
              trendLabel="יציב"
              accent="bg-secondary-fixed"
            />
            <KpiCard
              label="תיקונים שנמסרו"
              value={String(activeRepairs)}
              trendLabel={repairs > 0 ? `${repairs} התראות מלאי` : 'מלאי תקין'}
              accent="bg-tertiary-container"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
            <div className="bg-surface-container-lowest p-lg rounded border border-outline-variant lg:col-span-2 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-title-sm text-title-sm text-on-surface">רווחיות חודשית</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
                    <span className="w-3 h-3 rounded-full bg-primary-container" /> הכנסות
                  </div>
                  <div className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
                    <span className="w-3 h-3 rounded-full bg-secondary-fixed" /> רווח נקי
                  </div>
                </div>
              </div>
              <ProfitChart chart={dashboard?.charts?.monthly} />
            </div>

            <div className="bg-surface-container-lowest p-lg rounded border border-outline-variant flex flex-col">
              <h3 className="font-title-sm text-title-sm text-on-surface mb-6">פילוח מכירות</h3>
              <BreakdownChart breakdown={dashboard?.charts?.breakdown} />
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded border border-outline-variant overflow-hidden">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-title-sm text-title-sm text-on-surface">עסקאות אחרונות</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-outline-variant bg-surface-container-low">
                    <th className="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">תאריך</th>
                    <th className="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">פריט</th>
                    <th className="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">לקוח</th>
                    <th className="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">סכום</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-secondary">אין עסקאות עדיין</td>
                    </tr>
                  ) : (
                    transactions.map((txn, i) => (
                      <tr
                        key={txn.id}
                        className={`border-b border-outline-variant hover:bg-surface transition-colors ${i % 2 ? 'bg-surface-container-low/50' : ''}`}
                      >
                        <td className="p-4 text-secondary">{formatDate(txn.createdAt)}</td>
                        <td className="p-4 text-on-surface font-medium">{txn.items?.[0]?.name || '—'}</td>
                        <td className="p-4 text-secondary">{txn.customer?.fullName || 'לקוח מזדמן'}</td>
                        <td className="p-4 text-right font-data-mono text-data-mono text-on-surface font-bold">
                          {formatCurrency(txn.total)}
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
    </div>
  );
}
