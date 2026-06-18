import { Router } from 'express';
import { executeCode } from '../controllers/execution_controller.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = Router();
router.use(verifyAuth);

router.post('/run', executeCode);

export default router;
