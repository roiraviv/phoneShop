import { Router } from 'express';
import {
  listRepairs,
  getRepair,
  addRepair,
  patchRepair,
} from '../controllers/repairController.js';

const router = Router();

router.get('/', listRepairs);
router.post('/', addRepair);
router.get('/:id', getRepair);
router.patch('/:id', patchRepair);

export default router;
