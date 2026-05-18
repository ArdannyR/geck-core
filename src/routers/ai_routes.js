import { Router } from 'express';
import { improveText, chatWithAssistant, generateWallpaper, semanticSearch } from '../controllers/ai_controller.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = Router();
router.use(verifyAuth);

router.post('/chat', chatWithAssistant);
router.post('/generate-wallpaper', generateWallpaper);
router.post('/semantic-search', semanticSearch);
router.post('/improve-text', improveText);

export default router;
