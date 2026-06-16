import {
  getAllRepairs,
  findRepairById,
  createRepair,
  updateRepair,
} from '../storage/repositories/repairRepository.js';
import { findCustomerById } from '../storage/repositories/customerRepository.js';
import {
  notifyRepairCreated,
  notifyRepairStatusChange,
} from '../services/emailService.js';

export async function listRepairs(req, res) {
  try {
    let repairs = await getAllRepairs();
    const { status } = req.query;
    if (status) {
      repairs = repairs.filter((r) => r.status === status);
    }
    res.json({ success: true, data: repairs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getRepair(req, res) {
  try {
    const repair = await findRepairById(req.params.id);
    if (!repair) {
      return res.status(404).json({ success: false, message: 'Repair not found' });
    }
    res.json({ success: true, data: repair });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function addRepair(req, res) {
  try {
    const { customer, deviceModel, issueDescription, finalCustomerPrice } = req.body;
    if (!customer) {
      return res.status(400).json({ success: false, message: 'יש לבחור לקוח' });
    }
    if (!deviceModel?.trim()) {
      return res.status(400).json({ success: false, message: 'דגם מכשיר הוא שדה חובה' });
    }
    if (!issueDescription?.trim()) {
      return res.status(400).json({ success: false, message: 'תיאור תקלה הוא שדה חובה' });
    }
    if (finalCustomerPrice === undefined || finalCustomerPrice === null) {
      return res.status(400).json({ success: false, message: 'מחיר ללקוח הוא שדה חובה' });
    }

    const repair = await createRepair(req.body);

    const { updateCustomer } = await import('../storage/repositories/customerRepository.js');
    const cust = await findCustomerById(customer);
    if (cust) {
      const history = cust.repairHistory || [];
      if (!history.includes(repair.id)) {
        await updateCustomer(customer, { repairHistory: [...history, repair.id] });
      }
      notifyRepairCreated(repair, cust);
    }

    res.status(201).json({ success: true, data: repair });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function patchRepair(req, res) {
  try {
    const oldRepair = await findRepairById(req.params.id);
    const repair = await updateRepair(req.params.id, req.body);
    if (!repair) {
      return res.status(404).json({ success: false, message: 'Repair not found' });
    }

    if (req.body.status && oldRepair && oldRepair.status !== repair.status) {
      const cust = await findCustomerById(repair.customer);
      notifyRepairStatusChange(repair, oldRepair.status, cust);
    }

    res.json({ success: true, data: repair });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}
