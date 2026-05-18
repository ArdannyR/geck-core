import { Router } from 'express';
import { verifyAuth } from '../middlewares/auth.js';
import { accessChat, createGroupChat, fetchChats, sendMessage, fetchMessages, editMessage, deleteMessage, sendAudioMessage, sendFileMessage, markChatAsRead } from '../controllers/chat_controller.js';

const router = Router();
router.use(verifyAuth);

router.post('/access', accessChat);
router.post('/group', createGroupChat);
router.get('/chat', fetchChats);
router.post('/message', sendMessage);
router.post('/file', sendFileMessage);
router.post('/audio', sendAudioMessage);
router.patch('/message/:messageId', editMessage);
router.delete('/message/:messageId', deleteMessage);
router.get('/:chatId/chat', fetchMessages);
router.patch('/:chatId/read', markChatAsRead);


export default router;
