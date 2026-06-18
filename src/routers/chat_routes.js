import { Router } from 'express';
import { verifyAuth } from '../middlewares/auth.js';
import { accessChat, createGroupChat, fetchChats, sendMessage, fetchMessages, editMessage, deleteMessage, sendAudioMessage, sendFileMessage, markChatAsRead, deleteChat, leaveGroupChat } from '../controllers/chat_controller.js';

const router = Router();
router.use(verifyAuth);

router.post('/access', accessChat);
router.post('/group', createGroupChat);
router.get('/chat', fetchChats);
router.post('/message', sendMessage);
router.post('/audio', sendAudioMessage);
router.post('/file', sendFileMessage);
router.patch('/message/:messageId', editMessage);
router.delete('/message/:messageId', deleteMessage);
router.get('/:chatId/chat', fetchMessages);
router.patch('/:chatId/read', markChatAsRead);
router.delete('/:chatId/delete', deleteChat);
router.post('/:chatId/leave', leaveGroupChat);


export default router;
