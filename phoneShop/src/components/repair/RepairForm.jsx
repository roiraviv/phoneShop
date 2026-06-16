import Icon from '../ui/Icon';
import {
  SCREEN_LOCK_TYPES,
  DEVICE_ACCESSORIES,
  REPAIR_PRIORITIES,
} from '../../constants';

function Field({ label, required, children }) {
  return (
    <div>
      <label className="font-label-md text-label-md text-secondary block mb-xs">
        {label}{required && <span className="text-error"> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full px-md py-sm border border-outline-variant rounded-lg font-body-sm focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest';

export default function RepairForm({ form, setForm, customers }) {
  const toggleAccessory = (item) => {
    const list = form.accessoriesIncluded || [];
    setForm({
      ...form,
      accessoriesIncluded: list.includes(item)
        ? list.filter((a) => a !== item)
        : [...list, item],
    });
  };

  return (
    <div className="space-y-lg max-h-[70vh] overflow-y-auto pr-sm">
      <section>
        <h4 className="font-label-lg text-label-lg text-on-surface mb-md flex items-center gap-sm">
          <Icon name="person" className="text-primary text-[18px]" />
          לקוח ומכשיר
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <Field label="לקוח" required>
            <select
              className={inputClass}
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
              required
            >
              <option value="">בחר לקוח...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} – {c.phone}
                </option>
              ))}
            </select>
          </Field>
          <Field label="דגם מכשיר" required>
            <input className={inputClass} value={form.deviceModel} onChange={(e) => setForm({ ...form, deviceModel: e.target.value })} placeholder="iPhone 14 Pro" required />
          </Field>
          <Field label="IMEI">
            <input className={`${inputClass} font-data-mono`} value={form.imei} onChange={(e) => setForm({ ...form, imei: e.target.value })} placeholder="15 ספרות" />
          </Field>
          <Field label="מספר סידורי">
            <input className={`${inputClass} font-data-mono`} value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
          </Field>
        </div>
      </section>

      <section className="bg-error-container/10 border border-error-container/30 rounded-lg p-md">
        <h4 className="font-label-lg text-label-lg text-on-error-container mb-md flex items-center gap-sm">
          <Icon name="lock" className="text-[18px]" />
          קודי גישה למכשיר (רגיש!)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <Field label="סוג נעילת מסך">
            <select className={inputClass} value={form.screenLockType} onChange={(e) => setForm({ ...form, screenLockType: e.target.value })}>
              {SCREEN_LOCK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="קוד / סיסמה / תבנית">
            <input className={`${inputClass} font-data-mono`} value={form.devicePassword} onChange={(e) => setForm({ ...form, devicePassword: e.target.value })} placeholder="PIN, סיסמה או תיאור תבנית" />
          </Field>
          <Field label="קוד SIM (PIN2)">
            <input className={`${inputClass} font-data-mono`} value={form.simPin} onChange={(e) => setForm({ ...form, simPin: e.target.value })} placeholder="אם רלוונטי" />
          </Field>
        </div>
      </section>

      <section>
        <h4 className="font-label-lg text-label-lg text-on-surface mb-md flex items-center gap-sm">
          <Icon name="build" className="text-primary text-[18px]" />
          פרטי תיקון
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <Field label="תיאור תקלה" required>
            <textarea className={`${inputClass} resize-none h-20`} value={form.issueDescription} onChange={(e) => setForm({ ...form, issueDescription: e.target.value })} required />
          </Field>
          <Field label="מצב המכשיר בהגעה">
            <textarea className={`${inputClass} resize-none h-20`} value={form.deviceCondition} onChange={(e) => setForm({ ...form, deviceCondition: e.target.value })} placeholder="שריטות, שבירות, רטיבות..." />
          </Field>
          <Field label="עדיפות">
            <select className={inputClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {REPAIR_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </Field>
          <Field label="תאריך יעד למסירה">
            <input type="datetime-local" className={inputClass} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </Field>
        </div>
        <div className="mt-md">
          <span className="font-label-md text-label-md text-secondary block mb-sm">אביזרים שנמסרו עם המכשיר</span>
          <div className="flex flex-wrap gap-sm">
            {DEVICE_ACCESSORIES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAccessory(a)}
                className={`px-sm py-xs rounded-full font-label-md text-label-md border transition-colors ${
                  (form.accessoriesIncluded || []).includes(a)
                    ? 'bg-primary-container text-on-primary-container border-primary'
                    : 'border-outline-variant text-secondary hover:border-primary'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h4 className="font-label-lg text-label-lg text-on-surface mb-md flex items-center gap-sm">
          <Icon name="payments" className="text-primary text-[18px]" />
          עלויות ומחיר
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <Field label="עלות חלקים (₪)">
            <input type="number" min="0" step="0.01" className={`${inputClass} font-data-mono`} value={form.partCost} onChange={(e) => setForm({ ...form, partCost: e.target.value })} />
          </Field>
          <Field label="דמי עבודה (₪)">
            <input type="number" min="0" step="0.01" className={`${inputClass} font-data-mono`} value={form.laborCharge} onChange={(e) => setForm({ ...form, laborCharge: e.target.value })} />
          </Field>
          <Field label="מחיר סופי ללקוח (₪)" required>
            <input type="number" min="0" step="0.01" className={`${inputClass} font-data-mono`} value={form.finalCustomerPrice} onChange={(e) => setForm({ ...form, finalCustomerPrice: e.target.value })} required />
          </Field>
        </div>
        {form.finalCustomerPrice && (
          <p className="font-body-sm text-[#059669] mt-sm font-data-mono">
            רווח משוער: ₪{((Number(form.finalCustomerPrice) || 0) - (Number(form.partCost) || 0)).toFixed(2)}
          </p>
        )}
        <div className="mt-md">
          <Field label="הערת חלקים (ממתין לחלקים)">
            <input className={inputClass} value={form.partNote} onChange={(e) => setForm({ ...form, partNote: e.target.value })} placeholder="שם החלק, ספק, מעקב..." />
          </Field>
        </div>
        <div className="mt-md">
          <Field label="הערות טכנאי">
            <textarea className={`${inputClass} resize-none h-16`} value={form.technicianNotes} onChange={(e) => setForm({ ...form, technicianNotes: e.target.value })} />
          </Field>
        </div>
      </section>
    </div>
  );
}
