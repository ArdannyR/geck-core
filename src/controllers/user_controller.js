import User from '../models/User.js';
import Item from '../models/item.js';
import Workspace from '../models/Workspace.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { uploadFileToCloudinary } from '../helpers/cloudinary.js';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

export const getProfile = (req, res) => {
  const user = req.user;

  const { token, emailConfirmed, createdAt, updatedAt, __v, password, ...profileData } = user.toObject ? user.toObject() : user;

  profileData.nombre = profileData.name;
  delete profileData.name;

  res.status(200).json(profileData);
};

export const updatePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { passwordactual, passwordnuevo } = req.body || {};

    if (!passwordactual || !passwordnuevo) {
      return res.status(400).json({ msg: 'Debes enviar el password actual y el nuevo' });
    }

    const userDB = await User.findById(userId);
    if (!userDB) return res.status(404).json({ msg: 'Usuario no encontrado' });

    const isPasswordCorrect = await userDB.matchPassword(passwordactual);
    if (!isPasswordCorrect) {
      return res.status(400).json({ msg: 'Lo sentimos, el password actual no es correcto' });
    }

    userDB.password = await userDB.encryptPassword(passwordnuevo);
    await userDB.save();

    res.status(200).json({ msg: 'Password actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ msg: `Error en el servidor - ${error.message}` });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const id = req.user._id;
    const { nombre, name, email } = req.body;
    const finalName = nombre || name;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: `ID inválido: ${id}` });

    const userDB = await User.findById(id);
    if (!userDB) return res.status(404).json({ msg: `No existe el usuario con ID ${id}` });

    if (Object.values(req.body).includes('')) return res.status(400).json({ msg: 'Debes llenar todos los campos' });

    if (userDB.email !== email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ msg: 'El email ya se encuentra registrado' });
      }
    }

    userDB.name = finalName ?? userDB.name;
    userDB.email = email ?? userDB.email;
    await userDB.save();

    res.status(200).json({ msg: 'Perfil actualizado correctamente', user: userDB });
  } catch (error) {
    console.error('Error en updateProfile:', error);
    res.status(500).json({ msg: `Error en el servidor - ${error.message}` });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    console.log('=== DEBUG ===');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    console.log('type raw:', req.body?.type);
    console.log('=============');
    const userId = req.user._id;

    const { theme, accent, wallpaperUrl, phoneWallpaperUrl, type: rawType } = req.body || {};
    const type = rawType?.trim();

    const userDB = await User.findById(userId);
    if (!userDB) {
      return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
    }

    if (!userDB.preferences) userDB.preferences = {};

    let preferencesModified = false;

    if (theme && ['light', 'dark', 'system'].includes(theme)) {
      userDB.preferences.theme = theme;
      preferencesModified = true;
    }
    if (accent) {
      userDB.preferences.accent = accent;
      preferencesModified = true;
    }
    if (wallpaperUrl !== undefined) {
      userDB.preferences.wallpaperUrl = wallpaperUrl;
      preferencesModified = true;
    }
    if (phoneWallpaperUrl !== undefined) {
      userDB.preferences.phoneWallpaperUrl = phoneWallpaperUrl;
      preferencesModified = true;
    }

    // ✅ Con express-fileupload el archivo viene en req.files
    const archivo = req.files?.image;

    if (archivo) {
      if (!type || !['avatar', 'desktopWallpaper', 'phoneWallpaper'].includes(type)) {
        return res.status(400).json({
          ok: false,
          msg: 'Para subir imagen, "type" debe ser: avatar, desktopWallpaper o phoneWallpaper'
        });
      }

      // Determinar folder y lógica según el tipo
      let folder = 'VirtualDesk_Wallpapers';
      if (type === 'avatar') folder = 'VirtualDesk_Avatars';

      // Eliminar imagen anterior de Cloudinary antes de subir la nueva
      if (type === 'avatar' && userDB.avatarPublicId) {
        await cloudinary.uploader.destroy(userDB.avatarPublicId).catch(() => {});
      } else if (type === 'desktopWallpaper' && userDB.preferences.wallpaperPublicId) {
        await cloudinary.uploader.destroy(userDB.preferences.wallpaperPublicId).catch(() => {});
      } else if (type === 'phoneWallpaper' && userDB.preferences.phoneWallpaperPublicId) {
        await cloudinary.uploader.destroy(userDB.preferences.phoneWallpaperPublicId).catch(() => {});
      }

      // Subir a Cloudinary usando el tempFilePath que provee express-fileupload
      const { secure_url, public_id } = await uploadFileToCloudinary(archivo.tempFilePath, folder);

      // Guardar URL y publicId según el tipo
      if (type === 'avatar') {
        userDB.avatarUrl = secure_url;
        userDB.avatarPublicId = public_id;
      } else if (type === 'desktopWallpaper') {
        userDB.preferences.wallpaperUrl = secure_url;
        userDB.preferences.wallpaperPublicId = public_id;
      } else if (type === 'phoneWallpaper') {
        userDB.preferences.phoneWallpaperUrl = secure_url;
        userDB.preferences.phoneWallpaperPublicId = public_id;
      }

      preferencesModified = true;
    }

    if (preferencesModified) {
      userDB.markModified('preferences');
    }

    await userDB.save();

    return res.status(200).json({
      ok: true,
      msg: 'Preferencias actualizadas correctamente',
      preferences: userDB.preferences,
      avatarUrl: userDB.avatarUrl,
    });

  } catch (error) {
    console.error('❌ ERROR en updatePreferences:', error);
    return res.status(500).json({ ok: false, msg: `Error en el servidor - ${error.message}` });
  }
};

export const deleteAccount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { confirmationText } = req.body;

    const formattedName = req.user.name.replace(/\s+/g, '');
    const expectedText = `delete_${formattedName}`;

    if (!confirmationText || confirmationText !== expectedText) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ ok: false, msg: `Confirmación incorrecta. Esperado: ${expectedText}` });
    }

    const userFiles = await Item.find({ userId, publicId: { $ne: null } }).session(session);
    for (const file of userFiles) {
      await cloudinary.uploader.destroy(file.publicId).catch(() => {});
    }

    await Item.deleteMany({ userId }).session(session);

    await Item.updateMany(
      {},
      {
        $pull: {
          sharedWith: { userId: userId },
          guestPositions: { userId: userId }
        }
      },
      { session }
    );

    await Workspace.deleteMany({ owner: userId }).session(session);
    await Workspace.updateMany(
      { members: userId },
      { $pull: { members: userId } },
      { session }
    );

    const groupChatsWithAdmin = await Chat.find({
      isGroup: true, admins: userId
    }).session(session);

    const deleteChatIds = [];
    for (const chat of groupChatsWithAdmin) {
      if (chat.admins.length === 1 && chat.admins[0].toString() === userId.toString()) {
        deleteChatIds.push(chat._id);
      }
    }

    if (deleteChatIds.length > 0) {
      await Message.deleteMany({ chatId: { $in: deleteChatIds } }).session(session);
      await Chat.deleteMany({ _id: { $in: deleteChatIds } }).session(session);
    }

    await Chat.updateMany(
      { isGroup: true, participants: userId, _id: { $nin: deleteChatIds } },
      { $pull: { participants: userId, admins: userId } },
      { session }
    );

    await Chat.updateMany(
      { isGroup: false, participants: userId },
      { $pull: { participants: userId } },
      { session }
    );

    await Message.deleteMany({ senderId: userId }).session(session);

    await User.updateOne(
      { _id: userId },
      { $set: { token: null, pushToken: null } }
    ).session(session);

    await User.deleteOne({ _id: userId }).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ ok: true, msg: 'Tu cuenta y todos tus datos han sido eliminados correctamente.' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error en deleteAccount:', error);
    return res.status(500).json({ ok: false, msg: 'Hubo un error al intentar eliminar la cuenta.' });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({ ok: true, users: [] });
    }

    const users = await User.find({
      $or: [
        { email: { $regex: `^${q}`, $options: 'i' } },
        { name: { $regex: `^${q}`, $options: 'i' } }
      ]
    })
      .select('name email _id avatarUrl')
      .limit(5)
      .lean();

    return res.status(200).json({ ok: true, users });
  } catch (error) {
    console.error('Error en searchUsers:', error);
    return res.status(500).json({ ok: false, msg: 'Error al buscar usuarios' });
  }
};

export const updatePushToken = async (req, res) => {
  try {
    const userId = req.user._id;
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({ ok: false, msg: 'pushToken es requerido' });
    }

    await User.findByIdAndUpdate(userId, { pushToken });

    return res.status(200).json({ ok: true, msg: 'Push token actualizado correctamente', token: pushToken });
  } catch (error) {
    console.error('Error en updatePushToken:', error);
    return res.status(500).json({ ok: false, msg: 'Error al actualizar push token' });
  }
};