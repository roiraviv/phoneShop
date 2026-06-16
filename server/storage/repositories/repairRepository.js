import crypto from 'crypto';
import { readCollection, writeCollection, runAtomic, nowISO } from '../jsonStore.js';
import { enrichRepair } from '../../utils/productHelpers.js';
import { REPAIR_STATUS } from '../../constants/index.js';
import { calculateRepairProfit } from '../../utils/profitCalculator.js';
import { findCustomerById } from './customerRepository.js';

export async function getAllRepairs() {
  const repairs = await readCollection('repairs');
  const customers = await readCollection('customers');
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  return repairs
    .map((repair) => {
      const enriched = enrichRepair(repair);
      const customer = customerMap.get(repair.customer);
      return {
        ...enriched,
        customerName: customer?.fullName || 'Unknown',
        customerPhone: customer?.phone || '',
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function findRepairById(id) {
  const repairs = await readCollection('repairs');
  const repair = repairs.find((r) => r.id === id);
  if (!repair) return null;

  const customer = repair.customer
    ? await findCustomerById(repair.customer)
    : null;

  return {
    ...enrichRepair(repair),
    customerName: customer?.fullName,
    customerPhone: customer?.phone,
  };
}

export async function updateRepair(id, updates) {
  return runAtomic(async () => {
    const repairs = await readCollection('repairs');
    const index = repairs.findIndex((r) => r.id === id);
    if (index < 0) return null;

    const merged = { ...repairs[index], ...updates, updatedAt: nowISO() };

    if (
      updates.finalCustomerPrice !== undefined ||
      updates.partCost !== undefined
    ) {
      merged.profit = calculateRepairProfit(
        merged.finalCustomerPrice,
        merged.partCost
      );
    }

    if (updates.status === REPAIR_STATUS.FIXED && !merged.completedAt) {
      merged.completedAt = nowISO();
    }

    repairs[index] = merged;
    await writeCollection('repairs', repairs);
    return findRepairById(id);
  });
}

export async function updateRepairsByIds(ids, updates) {
  return runAtomic(async () => {
    const repairs = await readCollection('repairs');
    const idSet = new Set(ids);

    repairs.forEach((repair, index) => {
      if (idSet.has(repair.id)) {
        repairs[index] = { ...repair, ...updates, updatedAt: nowISO() };
      }
    });

    await writeCollection('repairs', repairs);
    return repairs.filter((r) => idSet.has(r.id)).map(enrichRepair);
  });
}

export async function createRepair(data) {
  return runAtomic(async () => {
    const repairs = await readCollection('repairs');
    const count = repairs.length;
    const partCost = Number(data.partCost ?? 0);
    const finalCustomerPrice = Number(data.finalCustomerPrice ?? 0);
    const profit = calculateRepairProfit(finalCustomerPrice, partCost);

    const repair = {
      id: crypto.randomUUID(),
      ticketNumber: `REP-${String(count + 1).padStart(5, '0')}`,
      status: REPAIR_STATUS.PENDING,
      receivedAt: nowISO(),
      laborCharge: Number(data.laborCharge ?? 0),
      partCost,
      finalCustomerPrice,
      profit,
      priority: data.priority ?? 'medium',
      imei: data.imei ?? '',
      serialNumber: data.serialNumber ?? '',
      devicePassword: data.devicePassword ?? '',
      screenLockType: data.screenLockType ?? 'none',
      simPin: data.simPin ?? '',
      deviceCondition: data.deviceCondition ?? '',
      accessoriesIncluded: data.accessoriesIncluded ?? [],
      dueDate: data.dueDate ?? null,
      partNote: data.partNote ?? '',
      technicianNotes: data.technicianNotes ?? '',
      customer: data.customer,
      deviceModel: data.deviceModel,
      issueDescription: data.issueDescription,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    repairs.push(repair);
    await writeCollection('repairs', repairs);
    return findRepairById(repair.id);
  });
}
