import { PHONE_STOCK_STATUS } from '../constants/index.js';
import { processSale, findProductByScanCode, findRepairById } from '../services/saleService.js';
import { notifyPhonePurchase, notifyRepairDeliveredFromSale } from '../services/emailService.js';
import { findProductById } from '../storage/repositories/productRepository.js';
import {
  findTransactionById,
  getTransactionsPaginated,
} from '../storage/repositories/transactionRepository.js';
import {
  buildProductLineItem,
  buildRepairLineItem,
  calculateTransactionTotals,
} from '../utils/profitCalculator.js';

/**
 * Controller לנקודת מכירה (POS) – אחסון JSON
 */

export async function createSale(req, res) {
  try {
    const populated = await processSale(req.body);

    const customer = populated.customer;
    if (customer) {
      notifyPhonePurchase(populated, customer, req.body.warrantyMonths ?? 12);
      notifyRepairDeliveredFromSale(populated, customer);
    }

    res.status(201).json({
      success: true,
      message: 'העסקה בוצעה בהצלחה',
      data: {
        transaction: populated,
        receipt: {
          transactionNumber: populated.transactionNumber,
          total: populated.total,
          totalProfit: populated.totalProfit,
          profitMarginPercent: populated.profitMarginPercent,
          items: populated.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.unitSellPrice,
            profit: item.lineProfit,
          })),
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'שגיאה בביצוע העסקה',
    });
  }
}

export async function scanBarcode(req, res) {
  try {
    const { code } = req.body;

    if (!code?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'יש להזין קוד ברקוד',
      });
    }

    const product = await findProductByScanCode(code);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `לא נמצא מוצר עבור: ${code}`,
      });
    }

    if (product.productType === 'phone' && product.stockStatus !== PHONE_STOCK_STATUS.IN_STOCK) {
      return res.status(400).json({
        success: false,
        message: `הטלפון ${product.make} ${product.model} אינו זמין (${product.stockStatus})`,
      });
    }

    if (product.productType === 'accessory' && product.stockQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: `${product.name} – אזל מהמלאי`,
      });
    }

    res.json({
      success: true,
      data: {
        product: {
          id: product.id,
          productType: product.productType,
          name: product.name,
          sellPrice: product.sellPrice,
          buyPrice: product.buyPrice,
          profitMarginPercent: product.profitMarginPercent,
          imei: product.imei,
          barcode: product.barcode,
          sku: product.sku,
          stockQuantity: product.stockQuantity,
          stockStatus: product.stockStatus,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function previewSale(req, res) {
  try {
    const { items: rawItems, discount = 0 } = req.body;
    const lineItems = [];

    for (const raw of rawItems) {
      if (raw.type === 'scan' || raw.type === 'product') {
        const product =
          raw.type === 'scan'
            ? await findProductByScanCode(raw.code)
            : await findProductById(raw.productId);

        if (!product) continue;
        lineItems.push(buildProductLineItem(product, raw.quantity || 1));
      } else if (raw.type === 'repair') {
        const repair = await findRepairById(raw.repairId);
        if (repair) lineItems.push(buildRepairLineItem(repair));
      }
    }

    const totals = calculateTransactionTotals(lineItems, discount);

    res.json({
      success: true,
      data: {
        items: lineItems,
        ...totals,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getSaleById(req, res) {
  try {
    const transaction = await findTransactionById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'עסקה לא נמצאה',
      });
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getSales(req, res) {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const { data, total } = await getTransactionsPaginated({
      page: Number(page),
      limit: Number(limit),
      startDate,
      endDate,
    });

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
