import { DATA_DIR, runAtomic, nowISO } from '../jsonStore.js';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULT_SETTINGS = {
  storeName: 'PhoneStore Pro',
  storePhone: '',
  storeEmail: '',
  storeAddress: '',
  taxRate: 0.17,
  defaultWarrantyMonths: 12,
  currency: 'ILS',
  lowStockDefaultThreshold: 5,
  repairDefaultLaborCharge: 50,
  receiptFooter: '',
  defaultPosCustomerId: null,
  smtp: {
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
  },
};

export async function getSettings() {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { ...DEFAULT_SETTINGS, updatedAt: nowISO() };
  }
}

export async function updateSettings(updates) {
  return runAtomic(async () => {
    const current = await getSettings();
    const merged = { ...current, ...updates, updatedAt: nowISO() };
    await fs.writeFile(SETTINGS_FILE, `${JSON.stringify(merged, null, 2)}\n`, 'utf-8');
    return merged;
  });
}
