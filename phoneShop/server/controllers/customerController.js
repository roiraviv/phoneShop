import {
  getAllCustomers,
  findCustomerById,
  searchCustomers,
  saveCustomer,
  updateCustomer,
} from '../storage/repositories/customerRepository.js';
import { readCollection } from '../storage/jsonStore.js';
import { getAllTransactions } from '../storage/repositories/transactionRepository.js';

export async function listCustomers(req, res) {
  try {
    const { search } = req.query;
    const data = search
      ? await searchCustomers(search)
      : await getAllCustomers();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getCustomer(req, res) {
  try {
    const customer = await findCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const [transactions, repairs] = await Promise.all([
      getAllTransactions(),
      readCollection('repairs'),
    ]);

    const purchaseHistory = transactions
      .filter((t) => t.customer === customer.id)
      .slice(0, 10)
      .map((t) => ({
        id: t.id,
        date: t.createdAt,
        total: t.total,
        items: t.items.map((i) => i.name).join(', '),
        type: 'purchase',
      }));

    const repairHistory = repairs
      .filter((r) => r.customer === customer.id)
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        date: r.receivedAt,
        total: r.finalCustomerPrice,
        items: `${r.deviceModel} - ${r.issueDescription}`,
        type: 'repair',
        ticketNumber: r.ticketNumber,
      }));

    res.json({
      success: true,
      data: {
        ...customer,
        history: [...purchaseHistory, ...repairHistory].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        ),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function addCustomer(req, res) {
  try {
    const { fullName, phone } = req.body;
    if (!fullName?.trim()) {
      return res.status(400).json({ success: false, message: 'שם לקוח הוא שדה חובה' });
    }
    if (!phone?.trim()) {
      return res.status(400).json({ success: false, message: 'מספר טלפון הוא שדה חובה' });
    }
    const customer = await saveCustomer(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function patchCustomer(req, res) {
  try {
    const customer = await updateCustomer(req.params.id, req.body);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}
