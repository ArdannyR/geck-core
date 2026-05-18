import { Router } from 'express';
import { getDesktop, createItem, uploadFileItem, getItemById, updateBulkPositions, updateItem, deleteItem, getAllItems } from '../controllers/item_controller.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = Router();
router.use(verifyAuth);

router.get('/desktop', getDesktop);
router.get('/all', getAllItems);
router.get('/get/:id', getItemById); 
router.post('/create', createItem);
router.post('/upload', uploadFileItem);
router.patch('/update/:id', updateItem); 
router.patch('/positions/bulk', updateBulkPositions);
router.delete('/delete/:id', deleteItem);

export default router;
