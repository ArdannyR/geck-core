import { Router } from 'express';
import { getProfile, updatePassword, updateProfile, updatePreferences, deleteAccount, searchUsers, updatePushToken } from '../controllers/user_controller.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = Router();
router.use(verifyAuth);

router.get('/profile', getProfile);
router.patch('/update-password', updatePassword);
router.patch('/preferences', updatePreferences);
router.get('/search', searchUsers);
router.delete('/delete-account', deleteAccount);
router.put('/profile/:id', updateProfile);
router.put('/update-push-token', updatePushToken);

export default router;
