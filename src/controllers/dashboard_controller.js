import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import { sendDesktopShareEmail } from '../helpers/mail.js';

export const shareDesktopAccess = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { email } = req.body;

    if (!email) return res.status(400).json({ msg: 'Debes ingresar un correo.' });

    const invitedUser = await User.findOne({ email });
    if (!invitedUser) return res.status(404).json({ msg: 'Usuario no encontrado con ese correo.' });

    if (String(invitedUser._id) === String(ownerId)) {
      return res.status(400).json({ msg: 'No puedes compartir el escritorio contigo mismo.' });
    }

    if (invitedUser.savedDesktops.includes(ownerId)) {
      return res.status(200).json({
        ok: true,
        msg: 'El usuario ya tiene acceso a tu escritorio.'
      });
    }

    invitedUser.savedDesktops.push(ownerId);
    await invitedUser.save();

    await sendDesktopShareEmail({ to: email, ownerName: req.user.name });

    return res.status(200).json({
      ok: true,
      msg: `Acceso concedido a ${invitedUser.name}`
    });
  } catch (error) {
    console.error('Error en shareDesktopAccess:', error);
    return res.status(500).json({ msg: 'Error al compartir escritorio' });
  }
};

export const getDashboardInfo = async (req, res) => {
  try {
    const userId = req.user._id;

    const userDB = await User.findById(userId)
      .populate('savedDesktops', 'name email')
      .select('-password -token -emailConfirmed');

    if (!userDB) return res.status(404).json({ msg: 'Usuario no encontrado' });

    const workspaces = await Workspace.find({
      members: userId
    }).select('name owner members createdAt');

    const userDataForFrontend = {
      ...userDB.toObject(),
      nombre: userDB.name,
      escritoriosGuardados: userDB.savedDesktops.map(desktop => ({
        _id: desktop._id,
        nombre: desktop.name,
        email: desktop.email
      }))
    };
    delete userDataForFrontend.name;
    delete userDataForFrontend.savedDesktops;

    const workspacesForFrontend = workspaces.map(ws => ({
      _id: ws._id,
      nombre: ws.name,
      dueño: ws.owner,
      miembros: ws.members,
      createdAt: ws.createdAt
    }));

    return res.status(200).json({
      ok: true,
      usuario: userDataForFrontend,
      workspaces: workspacesForFrontend
    });
  } catch (error) {
    console.error('Error en getDashboardInfo:', error);
    return res.status(500).json({ msg: 'Error al obtener datos del dashboard' });
  }
};
