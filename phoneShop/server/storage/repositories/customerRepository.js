import { readCollection, writeCollection, runAtomic, generateId, nowISO } from '../jsonStore.js';
import { enrichCustomer } from '../../utils/productHelpers.js';

export async function findCustomerById(id) {
  const customers = await readCollection('customers');
  return enrichCustomer(customers.find((c) => c.id === id) || null);
}

export async function getAllCustomers() {
  const customers = await readCollection('customers');
  return customers.map(enrichCustomer);
}

export async function searchCustomers(query) {
  const q = query.trim().toLowerCase();
  const customers = await readCollection('customers');
  return customers
    .filter(
      (c) =>
        c.isActive &&
        (c.fullName?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.phone2?.includes(q) ||
          c.nationalId?.includes(q) ||
          c.companyId?.includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.address?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q))
    )
    .map(enrichCustomer)
    .slice(0, 10);
}

export async function saveCustomer(customerData) {
  return runAtomic(async () => {
    const customers = await readCollection('customers');
    const index = customers.findIndex((c) => c.id === customerData.id);

    if (index >= 0) {
      customers[index] = {
        ...customers[index],
        ...customerData,
        updatedAt: nowISO(),
      };
      await writeCollection('customers', customers);
      return enrichCustomer(customers[index]);
    }

    const newCustomer = {
      id: generateId(),
      customerType: 'private',
      purchaseHistory: [],
      repairHistory: [],
      warranties: [],
      isActive: true,
      nationalId: '',
      companyId: '',
      phone2: '',
      city: '',
      zip: '',
      ...customerData,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    customers.push(newCustomer);
    await writeCollection('customers', customers);
    return enrichCustomer(newCustomer);
  });
}

export async function updateCustomer(id, updates) {
  return runAtomic(async () => {
    const customers = await readCollection('customers');
    const index = customers.findIndex((c) => c.id === id);
    if (index < 0) return null;

    customers[index] = { ...customers[index], ...updates, updatedAt: nowISO() };
    await writeCollection('customers', customers);
    return enrichCustomer(customers[index]);
  });
}
