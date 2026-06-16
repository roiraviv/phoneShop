import { getSettings } from '../storage/repositories/settingsRepository.js';

export const DEFAULT_SMTP = {
  enabled: false,
  host: '',
  port: 587,
  secure: false,
  user: '',
  pass: '',
  fromName: 'PhoneStore Pro',
  fromEmail: '',
  notifyRepairStatus: true,
  notifyRepairCreated: true,
  notifyPhonePurchase: true,
  notifyRepairDelivered: true,
};

export function getSmtpConfig(settings) {
  return { ...DEFAULT_SMTP, ...(settings?.smtp || {}) };
}

function wrapHtml(title, body) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:600px;margin:0 auto;padding:20px">
  <div style="border-bottom:2px solid #4f46e5;padding-bottom:12px;margin-bottom:20px">
    <h2 style="margin:0;color:#4f46e5">${title}</h2>
  </div>
  ${body}
  <p style="margin-top:32px;font-size:12px;color:#888">הודעה אוטומטית ממערכת ניהול החנות</p>
</body>
</html>`;
}

const STATUS_LABELS = {
  'ממתין': 'התיקון התקבל וממתין לטיפול',
  'ממתין לחלקים': 'התיקון ממתין להגעת חלקי חילוף',
  'בעבודה': 'התיקון בעבודה אצל הטכנאי',
  'תוקן': 'התיקון הושלם! המכשיר מוכן לאיסוף',
  'נמסר': 'המכשיר נמסר בהצלחה',
  'בוטל': 'התיקון בוטל',
};

export function buildRepairStatusEmail({ storeName, customer, repair, oldStatus, newStatus }) {
  const name = customer?.fullName || 'לקוח יקר';
  const statusMsg = STATUS_LABELS[newStatus] || `הסטטוס עודכן ל: ${newStatus}`;
  return {
    subject: `${storeName} – עדכון תיקון ${repair.ticketNumber}`,
    html: wrapHtml(
      'עדכון סטטוס תיקון',
      `<p>שלום ${name},</p>
       <p>${statusMsg}</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0">
         <tr><td style="padding:8px;border:1px solid #ddd"><strong>מספר כרטיס</strong></td><td style="padding:8px;border:1px solid #ddd">${repair.ticketNumber}</td></tr>
         <tr><td style="padding:8px;border:1px solid #ddd"><strong>מכשיר</strong></td><td style="padding:8px;border:1px solid #ddd">${repair.deviceModel}</td></tr>
         <tr><td style="padding:8px;border:1px solid #ddd"><strong>תקלה</strong></td><td style="padding:8px;border:1px solid #ddd">${repair.issueDescription}</td></tr>
         <tr><td style="padding:8px;border:1px solid #ddd"><strong>סטטוס קודם</strong></td><td style="padding:8px;border:1px solid #ddd">${oldStatus}</td></tr>
         <tr><td style="padding:8px;border:1px solid #ddd"><strong>סטטוס חדש</strong></td><td style="padding:8px;border:1px solid #ddd;font-weight:bold;color:#4f46e5">${newStatus}</td></tr>
         ${repair.finalCustomerPrice ? `<tr><td style="padding:8px;border:1px solid #ddd"><strong>מחיר</strong></td><td style="padding:8px;border:1px solid #ddd">₪${repair.finalCustomerPrice}</td></tr>` : ''}
       </table>
       ${newStatus === 'תוקן' ? '<p><strong>ניתן לגשת לחנות לאיסוף המכשיר.</strong></p>' : ''}
       <p>בברכה,<br>${storeName}</p>`
    ),
  };
}

export function buildRepairCreatedEmail({ storeName, customer, repair }) {
  const name = customer?.fullName || 'לקוח יקר';
  return {
    subject: `${storeName} – קבלת מכשיר לתיקון ${repair.ticketNumber}`,
    html: wrapHtml(
      'מכשיר התקבל לתיקון',
      `<p>שלום ${name},</p>
       <p>קיבלנו את המכשיר שלך למעבדת התיקונים.</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0">
         <tr><td style="padding:8px;border:1px solid #ddd"><strong>מספר כרטיס</strong></td><td style="padding:8px;border:1px solid #ddd">${repair.ticketNumber}</td></tr>
         <tr><td style="padding:8px;border:1px solid #ddd"><strong>מכשיר</strong></td><td style="padding:8px;border:1px solid #ddd">${repair.deviceModel}</td></tr>
         <tr><td style="padding:8px;border:1px solid #ddd"><strong>תקלה</strong></td><td style="padding:8px;border:1px solid #ddd">${repair.issueDescription}</td></tr>
         ${repair.dueDate ? `<tr><td style="padding:8px;border:1px solid #ddd"><strong>תאריך יעד</strong></td><td style="padding:8px;border:1px solid #ddd">${new Date(repair.dueDate).toLocaleDateString('he-IL')}</td></tr>` : ''}
       </table>
       <p>נעדכן אותך כשהסטטוס ישתנה.</p>
       <p>בברכה,<br>${storeName}</p>`
    ),
  };
}

export function buildPhonePurchaseEmail({ storeName, customer, transaction, phoneItems, warrantyMonths }) {
  const name = customer?.fullName || 'לקוח יקר';
  const itemsList = phoneItems
    .map(
      (i) =>
        `<li>${i.name}${i.imei ? ` (IMEI: ${i.imei})` : ''} – ₪${i.unitSellPrice}</li>`
    )
    .join('');
  return {
    subject: `${storeName} – אישור רכישת מכשיר`,
    html: wrapHtml(
      'תודה על הרכישה!',
      `<p>שלום ${name},</p>
       <p>תודה שרכשת אצלנו! להלן פרטי העסקה:</p>
       <p><strong>מספר עסקה:</strong> ${transaction.transactionNumber}</p>
       <ul>${itemsList}</ul>
       <p><strong>סה"כ לתשלום:</strong> ₪${transaction.total}</p>
       <p>המכשיר מגיע עם אחריות של ${warrantyMonths} חודשים.</p>
       <p>בברכה,<br>${storeName}</p>`
    ),
  };
}

export function buildRepairDeliveredEmail({ storeName, customer, item, transaction }) {
  const name = customer?.fullName || 'לקוח יקר';
  return {
    subject: `${storeName} – תיקון נמסר ${item.name}`,
    html: wrapHtml(
      'תיקון נמסר',
      `<p>שלום ${name},</p>
       <p>התיקון שולם ונמסר בהצלחה.</p>
       <p><strong>פריט:</strong> ${item.name}</p>
       <p><strong>מספר עסקה:</strong> ${transaction.transactionNumber}</p>
       <p><strong>סכום:</strong> ₪${item.unitSellPrice}</p>
       <p>תודה שבחרת בנו!</p>
       <p>בברכה,<br>${storeName}</p>`
    ),
  };
}

export function buildTestEmail({ storeName }) {
  return {
    subject: `${storeName} – בדיקת שליחת מייל`,
    html: wrapHtml(
      'בדיקת SMTP',
      `<p>שלום,</p><p>אם קיבלת מייל זה – הגדרות ה-SMTP תקינות ומוכנות לשליחה אוטומטית ללקוחות.</p><p>בברכה,<br>${storeName}</p>`
    ),
  };
}
