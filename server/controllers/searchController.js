import { readCollection } from '../storage/jsonStore.js';
import { enrichProduct } from '../utils/productHelpers.js';

export async function globalSearch(req, res) {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    if (q.length < 2) {
      return res.json({ success: true, data: { products: [], customers: [], repairs: [] } });
    }

    const [products, customers, repairs] = await Promise.all([
      readCollection('products'),
      readCollection('customers'),
      readCollection('repairs'),
    ]);

    const matchedProducts = products
      .filter(
        (p) =>
          p.isActive !== false &&
          (p.name?.toLowerCase().includes(q) ||
            p.imei?.includes(q) ||
            p.sku?.toLowerCase().includes(q) ||
            p.barcode?.includes(q) ||
            p.make?.toLowerCase().includes(q) ||
            p.model?.toLowerCase().includes(q))
      )
      .slice(0, 8)
      .map(enrichProduct);

    const matchedCustomers = customers
      .filter(
        (c) =>
          c.isActive !== false &&
          (c.fullName?.toLowerCase().includes(q) ||
            c.phone?.includes(q) ||
            c.phone2?.includes(q) ||
            c.nationalId?.includes(q) ||
            c.email?.toLowerCase().includes(q))
      )
      .slice(0, 8);

    const matchedRepairs = repairs
      .filter(
        (r) =>
          r.ticketNumber?.toLowerCase().includes(q) ||
          r.deviceModel?.toLowerCase().includes(q) ||
          r.imei?.includes(q) ||
          r.issueDescription?.toLowerCase().includes(q)
      )
      .slice(0, 8);

    res.json({
      success: true,
      data: {
        products: matchedProducts,
        customers: matchedCustomers,
        repairs: matchedRepairs,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
