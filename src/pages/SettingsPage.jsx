import { useEffect, useState } from 'react';
import TopNav from '../components/layout/TopNav';
import Icon from '../components/ui/Icon';
import { fetchSettings, updateSettings, testSmtpEmail } from '../api/settings';

const DEFAULT_SMTP = {
  enabled: false,
  host: '',
  port: 587,
  secure: false,
  user: '',
  pass: '',
  fromName: 'סלולריום',
  fromEmail: '',
  notifyRepairStatus: true,
  notifyRepairCreated: true,
  notifyPhonePurchase: true,
  notifyRepairDelivered: true,
};

const inputClass =
  'w-full px-md py-sm border border-outline-variant rounded-lg font-body-sm focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest';

function Section({ title, icon, children }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg">
      <h3 className="font-title-sm text-title-sm text-on-surface mb-lg flex items-center gap-sm">
        <Icon name={icon} className="text-primary" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="font-label-md text-label-md text-secondary block mb-xs">{label}</label>
      {children}
      {hint && <p className="font-body-sm text-secondary mt-xs text-[12px]">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    fetchSettings()
      .then((res) =>
        setForm({
          ...res.data,
          smtp: { ...DEFAULT_SMTP, ...(res.data.smtp || {}) },
        })
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const payload = {
        ...form,
        taxRate: Number(form.taxRate),
        defaultWarrantyMonths: Number(form.defaultWarrantyMonths),
        lowStockDefaultThreshold: Number(form.lowStockDefaultThreshold),
        repairDefaultLaborCharge: Number(form.repairDefaultLaborCharge),
        smtp: {
          ...form.smtp,
          port: Number(form.smtp?.port) || 587,
        },
      };
      const res = await updateSettings(payload);
      setForm(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const setSmtp = (key, value) =>
    setForm((prev) => ({ ...prev, smtp: { ...prev.smtp, [key]: value } }));

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      setTestResult('יש להזין כתובת מייל');
      return;
    }
    setTestingEmail(true);
    setTestResult('');
    try {
      await updateSettings({
        ...form,
        taxRate: Number(form.taxRate),
        smtp: { ...form.smtp, port: Number(form.smtp?.port) || 587 },
      });
      const res = await testSmtpEmail(testEmail.trim());
      setTestResult(res.message || 'נשלח בהצלחה!');
    } catch (err) {
      setTestResult(err.message);
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="page-shell">
        <TopNav title="הגדרות" />
        <main className="flex-1 flex items-center justify-center text-secondary">טוען הגדרות...</main>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <TopNav title="הגדרות מערכת">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-on-primary font-label-lg px-2 sm:px-md py-sm rounded-lg hover:opacity-90 flex items-center gap-xs disabled:opacity-50 min-h-[44px]"
        >
          <Icon name="save" className="text-[18px]" />
          <span className="hidden sm:inline">{saving ? 'שומר...' : 'שמור הגדרות'}</span>
          <span className="sm:hidden">{saving ? '...' : 'שמור'}</span>
        </button>
      </TopNav>

      <main className="page-main">
        <div className="max-w-3xl mx-auto space-y-lg">
          {saved && (
            <div className="bg-[#d1fae5] border border-[#059669] rounded-lg p-md flex items-center gap-sm text-[#065f46]">
              <Icon name="check_circle" />
              <span className="font-body-sm">ההגדרות נשמרו בהצלחה</span>
            </div>
          )}
          {error && (
            <div className="bg-error-container rounded-lg p-md text-on-error-container font-body-sm">{error}</div>
          )}

          <Section title="פרטי החנות" icon="storefront">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <Field label="שם החנות">
                <input className={inputClass} value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
              </Field>
              <Field label="טלפון חנות">
                <input className={`${inputClass} font-data-mono`} value={form.storePhone} onChange={(e) => setForm({ ...form, storePhone: e.target.value })} />
              </Field>
              <Field label="אימייל">
                <input type="email" className={inputClass} value={form.storeEmail} onChange={(e) => setForm({ ...form, storeEmail: e.target.value })} />
              </Field>
              <Field label="כתובת">
                <input className={inputClass} value={form.storeAddress} onChange={(e) => setForm({ ...form, storeAddress: e.target.value })} />
              </Field>
            </div>
          </Section>

          <Section title="הגדרות פיננסיות" icon="payments">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <Field label="מע&quot;מ (%)" hint="למשל 18 לאחוז מע&quot;מ בישראל">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className={`${inputClass} font-data-mono`}
                  value={(form.taxRate * 100).toFixed(2)}
                  onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) / 100 })}
                />
              </Field>
              <Field label="מטבע">
                <select className={inputClass} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  <option value="ILS">₪ שקל (ILS)</option>
                  <option value="USD">$ דולר (USD)</option>
                </select>
              </Field>
              <Field label="אחריות ברירת מחדל (חודשים)">
                <input type="number" min="0" className={`${inputClass} font-data-mono`} value={form.defaultWarrantyMonths} onChange={(e) => setForm({ ...form, defaultWarrantyMonths: e.target.value })} />
              </Field>
              <Field label="דמי עבודה ברירת מחדל לתיקון (₪)">
                <input type="number" min="0" className={`${inputClass} font-data-mono`} value={form.repairDefaultLaborCharge} onChange={(e) => setForm({ ...form, repairDefaultLaborCharge: e.target.value })} />
              </Field>
            </div>
          </Section>

          <Section title="מלאי" icon="inventory_2">
            <Field label="סף מלאי נמוך ברירת מחדל (יחידות)" hint="התראה כשכמות אביזר יורדת מתחת לערך זה">
              <input type="number" min="0" className={`${inputClass} font-data-mono max-w-xs`} value={form.lowStockDefaultThreshold} onChange={(e) => setForm({ ...form, lowStockDefaultThreshold: e.target.value })} />
            </Field>
          </Section>

          <Section title="שליחת מיילים (SMTP)" icon="mail">
            <div className="space-y-md">
              <label className="flex items-center gap-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.smtp?.enabled || false}
                  onChange={(e) => setSmtp('enabled', e.target.checked)}
                  className="rounded border-outline-variant"
                />
                <span className="font-body-sm text-on-surface">הפעל שליחת מייל אוטומטית ללקוחות</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <Field label="שרת SMTP" hint="למשל smtp.gmail.com">
                  <input className={inputClass} value={form.smtp?.host || ''} onChange={(e) => setSmtp('host', e.target.value)} placeholder="smtp.gmail.com" />
                </Field>
                <Field label="פורט">
                  <input type="number" className={`${inputClass} font-data-mono`} value={form.smtp?.port ?? 587} onChange={(e) => setSmtp('port', e.target.value)} />
                </Field>
                <Field label="משתמש (אימייל)">
                  <input type="email" className={inputClass} value={form.smtp?.user || ''} onChange={(e) => setSmtp('user', e.target.value)} />
                </Field>
                <Field label="סיסמה" hint="ב-Gmail השתמש ב-App Password. השאר ריק כדי לא לשנות.">
                  <input type="password" className={inputClass} value={form.smtp?.pass || ''} onChange={(e) => setSmtp('pass', e.target.value)} placeholder="••••••••" />
                </Field>
                <Field label="שם שולח">
                  <input className={inputClass} value={form.smtp?.fromName || ''} onChange={(e) => setSmtp('fromName', e.target.value)} />
                </Field>
                <Field label="אימייל שולח">
                  <input type="email" className={inputClass} value={form.smtp?.fromEmail || ''} onChange={(e) => setSmtp('fromEmail', e.target.value)} />
                </Field>
              </div>

              <label className="flex items-center gap-sm cursor-pointer">
                <input type="checkbox" checked={form.smtp?.secure || false} onChange={(e) => setSmtp('secure', e.target.checked)} />
                <span className="font-body-sm">חיבור מאובטח (SSL/TLS – פורט 465)</span>
              </label>

              <div className="bg-surface-container-low rounded-lg p-md space-y-sm">
                <p className="font-label-md text-secondary">שלח מייל כאשר:</p>
                {[
                  ['notifyRepairCreated', 'נפתח תיקון חדש'],
                  ['notifyRepairStatus', 'משתנה סטטוס תיקון'],
                  ['notifyRepairDelivered', 'תיקון נמסר/שולם בקופה'],
                  ['notifyPhonePurchase', 'נרכש מכשיר חדש'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.smtp?.[key] !== false}
                      onChange={(e) => setSmtp(key, e.target.checked)}
                    />
                    <span className="font-body-sm">{label}</span>
                  </label>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-sm items-start sm:items-end">
                <Field label="בדיקת שליחה">
                  <input
                    type="email"
                    className={inputClass}
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </Field>
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                  className="px-md py-sm bg-secondary-container text-on-secondary-container rounded-lg font-label-md hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                >
                  {testingEmail ? 'שולח...' : 'שלח מייל בדיקה'}
                </button>
              </div>
              {testResult && (
                <p className={`font-body-sm ${testResult.includes('נשלח') ? 'text-emerald-600' : 'text-error'}`}>
                  {testResult}
                </p>
              )}
            </div>
          </Section>

          <Section title="קבלה" icon="receipt_long">
            <Field label="טקסט תחתית קבלה">
              <textarea
                className={`${inputClass} resize-none h-24`}
                value={form.receiptFooter}
                onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
                placeholder="תודה שקניתם אצלנו!"
              />
            </Field>
          </Section>

          <div className="bg-surface-container-low rounded-lg p-md flex items-center gap-sm text-secondary font-body-sm">
            <Icon name="info" className="text-[18px]" />
            <span>הנתונים נשמרים בקובץ JSON מקומי: <code className="font-data-mono">data/settings.json</code></span>
          </div>
        </div>
      </main>
    </div>
  );
}
