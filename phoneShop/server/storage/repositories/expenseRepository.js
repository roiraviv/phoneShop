import { readCollection, isInDateRange } from '../jsonStore.js';

export async function getExpensesInRange(startDate, endDate) {
  const expenses = await readCollection('expenses');
  return expenses.filter((e) => isInDateRange(e.expenseDate, startDate, endDate));
}

export async function sumExpensesInRange(startDate, endDate) {
  const expenses = await getExpensesInRange(startDate, endDate);
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}
