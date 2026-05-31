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
router.patch('/preferences', updatePreferences);
router.delete('/delete-account', deleteAccount);
router.get('/search', searchUsers);
router.patch('/update-push-token', updatePushToken);

router.post('/preferences', (req, res, next) => {
  upload.single('image')(req, res, function (err) {
    if (err) {
      console.error('Error de Multer:', err);
      return res.status(500).json({ ok: false, msg: `Error al procesar archivo (Multer): ${err.message}` });
    }
    next();
  });
}, updatePreferences);

export default router;
