import Icon from '../ui/Icon';
import { CUSTOMER_TYPES } from '../../constants';

function Field({ label, required, children, className = '' }) {
  return (
    <div className={className}>
      <label className="font-label-md text-label-md text-secondary block mb-xs">
        {label}{required && <span className="text-error"> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full px-md py-sm border border-outline-variant rounded-lg font-body-sm focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest';

export default function CustomerForm({ form, setForm }) {
  const isBusiness = form.customerType === 'business';

  return (
    <div className="space-y-md max-h-[70vh] overflow-y-auto pr-sm">
      <Field label="סוג לקוח">
        <div className="flex gap-sm">
          {CUSTOMER_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setForm({ ...form, customerType: t.value })}
              className={`flex-1 py-sm rounded-lg font-label-md border ${
                form.customerType === t.value
                  ? 'border-primary bg-primary-container/10 text-primary'
                  : 'border-outline-variant text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="שם מלא" required>
        <input className={inputClass} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <Field label="טלפון נייד" required>
          <input className={`${inputClass} font-data-mono`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="050-1234567" required />
        </Field>
        <Field label="טלפון נוסף">
          <input className={`${inputClass} font-data-mono`} value={form.phone2} onChange={(e) => setForm({ ...form, phone2: e.target.value })} placeholder="קווי / משרד" />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        {isBusiness ? (
          <Field label="ח.פ / עוסק מורשה" required>
            <input className={`${inputClass} font-data-mono`} value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })} placeholder="9 ספרות" />
          </Field>
        ) : (
          <Field label="ת.ז">
            <input className={`${inputClass} font-data-mono`} value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} placeholder="9 ספרות" />
          </Field>
        )}
        <Field label="אימייל">
          <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
      </div>

      <Field label="כתובת">
        <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="רחוב ומספר בית" />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <Field label="עיר">
          <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </Field>
        <Field label="מיקוד">
          <input className={`${inputClass} font-data-mono`} value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
        </Field>
      </div>

      <Field label="הערות">
        <textarea className={`${inputClass} resize-none h-20`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
    </div>
  );
}
