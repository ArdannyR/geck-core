import { Router } from 'express';
import multer from 'multer';
import { getDesktop, createItem, uploadFileItem, getItemById, updateBulkPositions, updateItem, deleteItem, getAllItems } from '../controllers/item_controller.js';
import { verifyAuth } from '../middlewares/auth.js';

const upload = multer({ dest: 'uploads/' });
const router = Router();
router.use(verifyAuth);

router.get('/desktop', getDesktop);
router.post('/create', createItem);
router.post('/upload', uploadFileItem);
router.get('/get/:id', getItemById);
router.patch('/update/:id', updateItem);
router.patch('/positions/bulk', updateBulkPositions);
router.delete('/delete/:id', deleteItem);
router.get('/all', getAllItems);

export default router;
