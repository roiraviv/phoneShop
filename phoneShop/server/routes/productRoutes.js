import { Router } from 'express';
import {
  listProducts,
  getProduct,
  addProduct,
  patchProduct,
  removeProduct,
} from '../controllers/productController.js';

const router = Router();

router.get('/', listProducts);
router.post('/', addProduct);
router.get('/:id', getProduct);
router.patch('/:id', patchProduct);
router.delete('/:id', removeProduct);

export default router;
