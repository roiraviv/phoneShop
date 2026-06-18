import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DATA_DIR =
  process.env.DATA_DIR || path.join(__dirname, '../../data');

const COLLECTIONS = [
  'products',
  'customers',
  'repairs',
  'transactions',
  'expenses',
];

let writeQueue = Promise.resolve();

/** תור כתיבה – מונע התנגשויות בקבצי JSON */
export function runAtomic(fn) {
  const operation = writeQueue.then(() => fn());
  writeQueue = operation.then(() => undefined).catch(() => undefined);
  return operation;
}

/** אתחול תיקיית data וקבצי JSON ריקים */
export async function initStorage() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  for (const name of COLLECTIONS) {
    const filePath = path.join(DATA_DIR, `${name}.json`);
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      if (!raw.trim()) {
        await fs.writeFile(filePath, '[]\n', 'utf-8');
      } else {
        JSON.parse(raw);
      }
    } catch {
      await fs.writeFile(filePath, '[]\n', 'utf-8');
    }
  }

  if (!process.env.START_QUIET) {
    console.log(`📁 אחסון JSON פעיל: ${DATA_DIR}`);
  }
}

export async function readCollection(name) {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch (err) {
    if (err instanceof SyntaxError || err.code === 'ENOENT') {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(filePath, '[]\n', 'utf-8');
      return [];
    }
    throw err;
  }
}

export async function writeCollection(name, data) {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, `${content}\n`, 'utf-8');
}

export function generateId() {
  return crypto.randomUUID();
}

export function nowISO() {
  return new Date().toISOString();
}

export function isInDateRange(dateStr, startDate, endDate) {
  const time = new Date(dateStr).getTime();
  return time >= startDate.getTime() && time <= endDate.getTime();
}
