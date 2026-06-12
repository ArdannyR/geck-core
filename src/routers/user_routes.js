import { Router } from 'express';
import multer from 'multer';
import { getProfile, updatePassword, updateProfile, updatePreferences, deleteAccount, searchUsers, updatePushToken } from '../controllers/user_controller.js';
import { verifyAuth } from '../middlewares/auth.js';

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } 
});

const router = Router();

router.use(verifyAuth);

router.get('/profile', getProfile);
router.patch('/update-password', updatePassword);
router.patch('/profile/:id', updateProfile);
router.put('/preferences', updatePreferences);
router.post('/preferences', upload.single('image'), updatePreferences);
router.delete('/delete-account', deleteAccount);
router.get('/search', searchUsers);
router.patch('/update-push-token', updatePushToken);


export default router;
