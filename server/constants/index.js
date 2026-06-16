/** קטגוריות אביזרים */
export const ACCESSORY_CATEGORIES = [
  'מגן מסך',
  'כיסוי אחורי',
  'מטען',
  'אוזניות',
  'כבל',
  'אחר',
];

/** סטטוס מלאי לטלפונים */
export const PHONE_STOCK_STATUS = {
  IN_STOCK: 'במלאי',
  SOLD: 'נמכר',
  RESERVED: 'שמור',
  IN_REPAIR: 'בתיקון',
};

/** סטטוסי תיקון */
export const REPAIR_STATUS = {
  PENDING: 'ממתין',
  WAITING_PARTS: 'ממתין לחלקים',
  IN_PROGRESS: 'בעבודה',
  FIXED: 'תוקן',
  DELIVERED: 'נמסר',
  CANCELLED: 'בוטל',
};

/** סוגי פריטים בעסקה */
export const ITEM_TYPES = {
  PHONE: 'phone',
  ACCESSORY: 'accessory',
  REPAIR: 'repair',
};

/** אמצעי תשלום */
export const PAYMENT_METHODS = {
  CASH: 'מזומן',
  CREDIT: 'אשראי',
  TRANSFER: 'העברה בנקאית',
  MIXED: 'משולב',
};

/** קטגוריות הוצאות */
export const EXPENSE_CATEGORIES = {
  PARTS: 'רכישת חלקים',
  RENT: 'שכירות',
  UTILITIES: 'חשבונות',
  SALARY: 'שכר',
  MARKETING: 'שיווק',
  OTHER: 'אחר',
};
