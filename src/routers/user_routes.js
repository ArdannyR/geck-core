import { Router } from 'express';
import { getProfile, updatePassword, updateProfile, updatePreferences, deleteAccount, searchUsers, updatePushToken } from '../controllers/user_controller.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = Router();
router.use(verifyAuth);

router.get('/profile', getProfile);
router.patch('/update-password', updatePassword);
router.put('/profile/:id', updateProfile);
router.patch('/preferences', updatePreferences);
router.delete('/delete-account', deleteAccount);
router.get('/search', searchUsers); 
router.put('/update-push-token', updatePushToken); // falta probar

export default router;
