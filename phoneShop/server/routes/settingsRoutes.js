import { Router } from 'express';
import { readSettings, patchSettings, testSmtp } from '../controllers/settingsController.js';

const router = Router();

router.get('/', readSettings);
router.patch('/', patchSettings);
router.post('/test-email', testSmtp);

export default router;
