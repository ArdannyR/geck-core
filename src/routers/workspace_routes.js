import { Router } from 'express';
import { createWorkspace, inviteMember, fetchUserWorkspaces, acceptInvite, leaveWorkspace } from '../controllers/workspace_controller.js';
import { verifyAuth } from '../middlewares/auth.js';

const router = Router();
router.use(verifyAuth);

router.post('/create', createWorkspace);
router.get('/fetch-user-workspaces', fetchUserWorkspaces);
router.post('/invite', inviteMember);
router.get('/accept-invite/:token', acceptInvite);
router.delete('/:id/leave', leaveWorkspace);

export default router;
