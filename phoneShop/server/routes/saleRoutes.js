import { Router } from 'express';
import {
  createSale,
  scanBarcode,
  previewSale,
  getSaleById,
  getSales,
} from '../controllers/saleController.js';

const router = Router();

router.post('/', createSale);
router.post('/scan', scanBarcode);
router.post('/preview', previewSale);
router.get('/', getSales);
router.get('/:id', getSaleById);

export default router;
