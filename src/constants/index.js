export const REPAIR_COLUMNS = [
  { key: 'ממתין', label: 'To Do', badge: 'bg-surface-variant text-on-surface-variant' },
  { key: 'ממתין לחלקים', label: 'Waiting for Parts', badge: 'bg-[#fef3c7] text-[#92400e]' },
  { key: 'בעבודה', label: 'In Progress', badge: 'bg-[#e0e7ff] text-[#3730a3]' },
  { key: 'תוקן', label: 'Ready', badge: 'bg-[#d1fae5] text-[#065f46]' },
];

export const STATUS_TO_COLUMN = {
  'ממתין': 'ממתין',
  'ממתין לחלקים': 'ממתין לחלקים',
  'בעבודה': 'בעבודה',
  'תוקן': 'תוקן',
};

export const NAV_ITEMS = [
  { path: '/', icon: 'dashboard', label: 'דשבורד' },
  { path: '/reports', icon: 'assessment', label: 'דוחות' },
  { path: '/pos', icon: 'point_of_sale', label: 'קופה' },
  { path: '/inventory', icon: 'inventory_2', label: 'מלאי' },
  { path: '/repairs', icon: 'build', label: 'תיקונים' },
  { path: '/crm', icon: 'group', label: 'לקוחות' },
  { path: '/settings', icon: 'settings', label: 'הגדרות' },
];

export const MOBILE_PRIMARY_NAV = NAV_ITEMS.filter((item) =>
  ['/', '/inventory', '/repairs'].includes(item.path)
);

export const MOBILE_MORE_NAV = NAV_ITEMS.filter((item) =>
  ['/crm', '/settings', '/reports'].includes(item.path)
);

export const ACCESSORY_CATEGORIES = [
  'מגן מסך',
  'כיסוי אחורי',
  'מטען',
  'אוזניות',
  'כבל',
  'אחר',
];

export const PHONE_STOCK_STATUS = {
  IN_STOCK: 'במלאי',
  SOLD: 'נמכר',
  RESERVED: 'שמור',
  IN_REPAIR: 'בתיקון',
};

export const STOCK_STATUS_LABELS = {
  'במלאי': { label: 'In Stock', className: 'bg-[#d1fae5] text-[#065f46]' },
  'נמכר': { label: 'Sold', className: 'bg-surface-variant text-on-surface-variant' },
  'שמור': { label: 'Reserved', className: 'bg-[#e0e7ff] text-[#3730a3]' },
  'בתיקון': { label: 'In Repair', className: 'bg-[#fef3c7] text-[#92400e]' },
};

export const CUSTOMER_TYPES = [
  { value: 'private', label: 'פרטי' },
  { value: 'business', label: 'עסקי' },
];

/** לקוח ברירת מחדל בקופה כשלא נבחר לקוח אחר */
export const DEFAULT_POS_CUSTOMER = {
  id: null,
  fullName: 'לקוח מזדמן',
  phone: '',
  customerType: 'private',
  nationalId: '',
  companyId: '',
  isDefault: true,
};

export const SCREEN_LOCK_TYPES = [
  { value: 'none', label: 'ללא נעילה' },
  { value: 'pin', label: 'קוד PIN' },
  { value: 'password', label: 'סיסמה' },
  { value: 'pattern', label: 'תבנית' },
  { value: 'face', label: 'זיהוי פנים' },
  { value: 'fingerprint', label: 'טביעת אצבע' },
];

export const DEVICE_ACCESSORIES = [
  'מטען',
  'כבל',
  'כיסוי',
  'אוזניות',
  'כרטיס SIM',
  'כרטיס זיכרון',
];

export const REPAIR_PRIORITIES = [
  { value: 'low', label: 'נמוכה' },
  { value: 'medium', label: 'בינונית' },
  { value: 'high', label: 'גבוהה' },
];

export const EMPTY_CUSTOMER_FORM = {
  fullName: '',
  customerType: 'private',
  phone: '',
  phone2: '',
  nationalId: '',
  companyId: '',
  email: '',
  address: '',
  city: '',
  zip: '',
  notes: '',
};

export const EMPTY_REPAIR_FORM = {
  customer: '',
  deviceModel: '',
  imei: '',
  serialNumber: '',
  devicePassword: '',
  screenLockType: 'none',
  simPin: '',
  deviceCondition: '',
  accessoriesIncluded: [],
  issueDescription: '',
  partCost: '',
  laborCharge: '',
  finalCustomerPrice: '',
  priority: 'medium',
  dueDate: '',
  partNote: '',
  technicianNotes: '',
};
