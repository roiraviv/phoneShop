import Modal from '../ui/Modal';
import Icon from '../ui/Icon';
import { REPAIR_COLUMNS, SCREEN_LOCK_TYPES } from '../../constants';
import { formatCurrency, formatDate } from '../../utils/format';

function DetailRow({ label, value, mono = false, sensitive = false }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-md py-sm border-b border-outline-variant last:border-0">
      <span className="font-label-md text-label-md text-secondary shrink-0">{label}</span>
      <span className={`text-right text-on-surface ${mono ? 'font-data-mono' : 'font-body-sm'} ${sensitive ? 'text-error font-bold' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export default function RepairDetailModal({ repair, open, onClose, onStatusChange }) {
  if (!repair) return null;

  const lockLabel = SCREEN_LOCK_TYPES.find((t) => t.value === repair.screenLockType)?.label;

  return (
    <Modal open={open} onClose={onClose} title={`תיקון #${repair.ticketNumber}`} wide>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div>
          <h4 className="font-label-lg text-label-lg text-on-surface mb-sm">לקוח</h4>
          <DetailRow label="שם" value={repair.customerName} />
          <DetailRow label="טלפון" value={repair.customerPhone} mono />
        </div>
        <div>
          <h4 className="font-label-lg text-label-lg text-on-surface mb-sm">מכשיר</h4>
          <DetailRow label="דגם" value={repair.deviceModel} />
          <DetailRow label="IMEI" value={repair.imei} mono />
          <DetailRow label="סידורי" value={repair.serialNumber} mono />
        </div>
      </div>

      <div className="mt-lg bg-error-container/10 border border-error-container/30 rounded-lg p-md">
        <h4 className="font-label-lg text-label-lg text-on-error-container mb-sm flex items-center gap-sm">
          <Icon name="lock" className="text-[18px]" />
          קודי גישה
        </h4>
        <DetailRow label="סוג נעילה" value={lockLabel} />
        <DetailRow label="קוד/סיסמה" value={repair.devicePassword} mono sensitive />
        <DetailRow label="קוד SIM" value={repair.simPin} mono sensitive />
      </div>

      <div className="mt-lg">
        <h4 className="font-label-lg text-label-lg text-on-surface mb-sm">תיקון</h4>
        <DetailRow label="תקלה" value={repair.issueDescription} />
        <DetailRow label="מצב בהגעה" value={repair.deviceCondition} />
        <DetailRow label="אביזרים" value={(repair.accessoriesIncluded || []).join(', ')} />
        <DetailRow label="חלקים" value={repair.partNote} />
        <DetailRow label="הערות טכנאי" value={repair.technicianNotes} />
      </div>

      <div className="mt-lg grid grid-cols-2 md:grid-cols-4 gap-md">
        <div className="bg-surface-container-low rounded-lg p-sm text-center">
          <p className="font-label-md text-label-md text-secondary">עלות חלקים</p>
          <p className="font-data-mono text-on-surface">{formatCurrency(repair.partCost)}</p>
        </div>
        <div className="bg-surface-container-low rounded-lg p-sm text-center">
          <p className="font-label-md text-label-md text-secondary">דמי עבודה</p>
          <p className="font-data-mono text-on-surface">{formatCurrency(repair.laborCharge)}</p>
        </div>
        <div className="bg-surface-container-low rounded-lg p-sm text-center">
          <p className="font-label-md text-label-md text-secondary">מחיר ללקוח</p>
          <p className="font-data-mono text-on-surface">{formatCurrency(repair.finalCustomerPrice)}</p>
        </div>
        <div className="bg-[#d1fae5] rounded-lg p-sm text-center">
          <p className="font-label-md text-label-md text-[#065f46]">רווח</p>
          <p className="font-data-mono text-[#065f46] font-bold">{formatCurrency(repair.profit)}</p>
        </div>
      </div>

      <div className="mt-lg flex items-center gap-md">
        <label className="font-label-md text-label-md text-secondary">סטטוס:</label>
        <select
          className="px-md py-sm border border-outline-variant rounded-lg font-body-sm focus:border-primary bg-surface-container-lowest"
          value={repair.status}
          onChange={(e) => onStatusChange(repair.id, e.target.value)}
        >
          {REPAIR_COLUMNS.map((col) => (
            <option key={col.key} value={col.key}>{col.label}</option>
          ))}
        </select>
        {repair.dueDate && (
          <span className="font-body-sm text-secondary ml-auto flex items-center gap-xs">
            <Icon name="calendar_today" className="text-[16px]" />
            יעד: {formatDate(repair.dueDate)}
          </span>
        )}
      </div>
    </Modal>
  );
}
