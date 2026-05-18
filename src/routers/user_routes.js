import { Router } from 'express';
import { getProfile, updatePassword, updateProfile, updatePreferences, deleteAccount, searchUsers, updatePushToken } from '../controllers/user_controller.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = Router();
router.use(verifyAuth);

router.get('/profile', getProfile);
router.patch('/update-password', updatePassword);
router.patch('/profile/:id', updateProfile);
router.patch('/preferences', updatePreferences);
router.delete('/delete-account', deleteAccount);
router.get('/search', searchUsers); 
router.patch('/update-push-token', updatePushToken); 

export default router;
