import { Router } from 'express';
import {
  listCustomers,
  getCustomer,
  addCustomer,
  patchCustomer,
} from '../controllers/customerController.js';

const router = Router();

router.get('/', listCustomers);
router.post('/', addCustomer);
router.get('/:id', getCustomer);
router.patch('/:id', patchCustomer);

export default router;
