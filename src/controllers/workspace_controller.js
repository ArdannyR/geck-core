import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import crypto from 'crypto';
import { sendWorkspaceInviteEmail } from '../helpers/mail.js';

// 5 endpoints: createWorkspace, inviteMember, acceptInvite, leaveWorkspace, fetchUserWorkspaces
export const createWorkspace = async (req, res) => {
  try {
    const userId = req.user._id;
    const { nombre, name } = req.body;
    const finalName = nombre || name;

    if (!finalName) return res.status(400).json({ ok: false, msg: 'El nombre es obligatorio' });

    const newWorkspace = new Workspace({
      name: finalName,
      owner: userId,
      members: [userId]
    });
    await newWorkspace.save();

    const newChat = new Chat({
      isGroup: true,
      participants: [userId],
      admins: [userId],
      groupName: finalName,
      workspaceId: newWorkspace._id
    });
    await newChat.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userId}`).emit('workspace-created', {
        workspace: newWorkspace,
        chat: newChat
      });
    }

    return res.status(201).json({
      ok: true,
      msg: 'Espacio de trabajo y chat creados exitosamente',
      workspace: newWorkspace,
      chat: newChat
    });
  } catch (error) {
    console.error('Error en createWorkspace:', error);
    return res.status(500).json({ ok: false, msg: 'Error al crear workspace' });
  }
};

export const inviteMember = async (req, res) => {
  try {
    const { workspaceId, email } = req.body;
    const inviterUser = req.user;

    if (!workspaceId || !email) {
      return res.status(400).json({ ok: false, msg: 'Faltan datos' });
    }

    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ ok: false, msg: 'Workspace no encontrado' });
    }

    const isOwnerOrMember = workspace.members.some(
      m => m.toString() === inviterUser._id.toString()
    );
    if (!isOwnerOrMember) {
      return res.status(403).json({ ok: false, msg: 'No tienes permiso para invitar' });
    }

    if (workspace.members.some(m => m.toString() === invitedUser._id.toString())) {
      return res.status(400).json({ ok: false, msg: 'El usuario ya es miembro' });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');

    if (!workspace.pendingInvites) workspace.pendingInvites = [];

    workspace.pendingInvites = workspace.pendingInvites.filter(
      inv => inv.email !== email
    );

    workspace.pendingInvites.push({
      email,
      token: inviteToken,
      invitedBy: inviterUser._id,
      createdAt: new Date()
    });
    await workspace.save();

    await sendWorkspaceInviteEmail({
      to: email,
      inviterName: inviterUser.name,
      workspaceName: workspace.name,
      token: inviteToken,
      workspaceId: workspace._id
    });

    return res.status(200).json({
      ok: true,
      token: inviteToken,
      msg: `Invitación enviada a ${email}. El usuario recibirá un correo para unirse. `

    });
  } catch (error) {
    console.error('Error en inviteMember:', error);
    return res.status(500).json({ ok: false, msg: 'Error al invitar miembro' });
  }
};

export const acceptInvite = async (req, res) => {
  try {
    const { token } = req.params;

    const workspace = await Workspace.findOne({
      'pendingInvites.token': token
    });

    if (!workspace) {
      return res.status(404).json({ ok: false, msg: 'Invitación no válida o ya fue usada' });
    }

    const invite = workspace.pendingInvites.find(inv => inv.token === token);
    if (!invite) {
      return res.status(404).json({ ok: false, msg: 'Invitación no encontrada' });
    }

    if (req.user.email !== invite.email) {
      return res.status(403).json({ 
        ok: false, 
        msg: 'No tienes permiso para aceptar esta invitación. Debes iniciar sesión con la cuenta de correo invitada.' 
      });
    }

    const hoursDiff = (Date.now() - new Date(invite.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 48) {
      return res.status(400).json({ ok: false, msg: 'La invitación ha expirado (48h)' });
    }

    const invitedUser = await User.findOne({ email: invite.email });
    if (!invitedUser) {
      return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
    }

    if (!workspace.members.some(m => m.toString() === invitedUser._id.toString())) {
      workspace.members.push(invitedUser._id);
    }

    workspace.pendingInvites = workspace.pendingInvites.filter(inv => inv.token !== token);
    await workspace.save();

    const chat = await Chat.findOne({ workspaceId: workspace._id, isGroup: true });
    if (chat && !chat.participants.some(p => p.toString() === invitedUser._id.toString())) {
      chat.participants.push(invitedUser._id);
      await chat.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`workspace:${workspace._id}`).emit('workspace-member-joined', {
        workspaceId: workspace._id,
        user: {
          _id: invitedUser._id,
          name: invitedUser.name,
          email: invitedUser.email
        }
      });

      io.to(`user:${invitedUser._id}`).emit('workspace-joined', {
        workspace,
        chat
      });
    }

    return res.status(200).json({
      ok: true,
      msg: `¡Bienvenido al espacio "${workspace.name}"!`,
      workspace,
      chat
    });
  } catch (error) {
    console.error('Error en acceptInvite:', error);
    return res.status(500).json({ ok: false, msg: 'Error al aceptar invitación' });
  }
};

export const leaveWorkspace = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ ok: false, msg: 'Workspace no encontrado' });
    }

    if (workspace.owner.toString() === userId.toString()) {
      return res.status(400).json({
        ok: false,
        msg: 'Eres el dueño. Debes eliminar el workspace, no salir de él.'
      });
    }

    workspace.members = workspace.members.filter(
      m => m.toString() !== userId.toString()
    );
    await workspace.save();

    const chat = await Chat.findOne({ workspaceId: workspace._id, isGroup: true });
    if (chat) {
      chat.participants = chat.participants.filter(
        p => p.toString() !== userId.toString()
      );
      await chat.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`workspace:${workspaceId}`).emit('workspace-member-left', {
        workspaceId,
        userId: userId.toString(),
        userName: req.user.name
      });
    }

    return res.status(200).json({
      ok: true,
      msg: `Has salido del workspace "${workspace.name}"`
    });
  } catch (error) {
    console.error('Error en leaveWorkspace:', error);
    return res.status(500).json({ ok: false, msg: 'Error al salir del workspace' });
  }
};

export const fetchUserWorkspaces = async (req, res) => {
  try {
    const userId = req.user._id;
    const workspaces = await Workspace.find({ members: userId })
      .populate('owner', 'name email')
      .populate('members', 'name email avatarUrl');

    return res.status(200).json({ ok: true, workspaces });
  } catch (error) {
    console.error('Error en fetchUserWorkspaces:', error);
    return res.status(500).json({ ok: false, msg: 'Error al obtener los espacios de trabajo' });
  }
};
