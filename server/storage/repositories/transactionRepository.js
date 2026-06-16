import { readCollection, writeCollection, runAtomic, generateId, nowISO, isInDateRange } from '../jsonStore.js';
import { enrichTransaction } from '../../utils/productHelpers.js';
import { findCustomerById } from './customerRepository.js';

export async function getAllTransactions(filters = {}) {
  let transactions = await readCollection('transactions');

  if (filters.startDate || filters.endDate) {
    const start = filters.startDate ? new Date(filters.startDate) : new Date(0);
    const end = filters.endDate ? new Date(filters.endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    transactions = transactions.filter((t) =>
      isInDateRange(t.createdAt, start, end)
    );
  }

  return transactions.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

export async function findTransactionById(id) {
  const transactions = await readCollection('transactions');
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) return null;

  const customer = transaction.customer
    ? await findCustomerById(transaction.customer)
    : null;

  return enrichTransaction(transaction, customer);
}

export async function createTransaction(data) {
  return runAtomic(async () => {
    const transactions = await readCollection('transactions');
    const count = transactions.length;

    const transaction = {
      id: generateId(),
      transactionNumber: `TXN-${String(count + 1).padStart(6, '0')}`,
      ...data,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    transactions.push(transaction);
    await writeCollection('transactions', transactions);
    return transaction;
  });
}

export async function getTransactionsPaginated({ page = 1, limit = 20, startDate, endDate }) {
  const all = await getAllTransactions({ startDate, endDate });
  const total = all.length;
  const data = all.slice((page - 1) * limit, page * limit);

  const customers = await readCollection('customers');
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const enriched = data.map((t) => {
    const customer = t.customer ? customerMap.get(t.customer) : null;
    return enrichTransaction(
      t,
      customer
        ? { id: customer.id, fullName: customer.fullName, phone: customer.phone }
        : null
    );
  });

  return { data: enriched, total, page, limit };
}
