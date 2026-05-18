import User from '../models/User.js';
import Item from '../models/item.js';
import Workspace from '../models/Workspace.js';
import { uploadFileToCloudinary } from '../helpers/cloudinary.js';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

// 6 endpoints: getProfile, updatePassword, updateProfile, updatePreferences, deleteAccount, searchUsers
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
    const { id } = req.params;
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
    const userId = req.user._id;
    // Recibimos los datos de texto (si los envían)
    const { theme, accent } = req.body;

    const userDB = await User.findById(userId);
    if (!userDB) return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });

    // 1. Actualizar campos de texto
    if (theme && ['light', 'dark'].includes(theme)) userDB.preferences.theme = theme;
    if (accent) userDB.preferences.accent = accent;

    // 2. Procesar archivos si vienen en la petición (form-data)
    if (req.files) {
      
      // Si el frontend envió un avatar
      if (req.files.avatar) {
        // Borramos el anterior de Cloudinary si existe para no acumular basura
        if (userDB.avatarPublicId) {
          await cloudinary.uploader.destroy(userDB.avatarPublicId).catch(() => {});
        }
        // Subimos el nuevo
        const { secure_url, public_id } = await uploadFileToCloudinary(req.files.avatar.tempFilePath, 'VirtualDesk_Avatars');
        userDB.avatarUrl = secure_url; // Aquí guardamos la URL correcta
        userDB.avatarPublicId = public_id;
      }

      // Si el frontend envió un wallpaper
      if (req.files.wallpaper) {
        if (userDB.preferences.wallpaperPublicId) {
          await cloudinary.uploader.destroy(userDB.preferences.wallpaperPublicId).catch(() => {});
        }
        const { secure_url, public_id } = await uploadFileToCloudinary(req.files.wallpaper.tempFilePath, 'VirtualDesk_Wallpapers');
        userDB.preferences.wallpaperUrl = secure_url;
        userDB.preferences.wallpaperPublicId = public_id;
      }

      if (req.files.phoneWallpaper) {
        if (userDB.preferences.phoneWallpaperPublicId) {
          await cloudinary.uploader.destroy(userDB.preferences.phoneWallpaperPublicId).catch(() => {});
        }
        const { secure_url, public_id } = await uploadFileToCloudinary(req.files.phoneWallpaper.tempFilePath, 'PhoneWallpapers');
        userDB.preferences.phoneWallpaperUrl = secure_url;
        userDB.preferences.phoneWallpaperPublicId = public_id;
      }
    }

    // Guardamos todos los cambios de una sola vez
    await userDB.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userId}`).emit('preferences-updated', {
        theme: userDB.preferences.theme,
        accent: userDB.preferences.accent,
        wallpaperUrl: userDB.preferences.wallpaperUrl,
        phoneWallpaperUrl: userDB.preferences.phoneWallpaperUrl,
        avatarUrl: userDB.avatarUrl
      });
    }

    return res.status(200).json({ 
      ok: true, 
      msg: 'Preferencias e imágenes actualizadas correctamente', 
      preferences: userDB.preferences,
      avatarUrl: userDB.avatarUrl,
      phoneWallpaperUrl: userDB.preferences.phoneWallpaperUrl
    });

  } catch (error) {
    console.error('Error en updatePreferences:', error);
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

    await User.updateMany(
      { savedDesktops: userId },
      { $pull: { savedDesktops: userId } },
      { session }
    );

    await User.findByIdAndDelete(userId).session(session);

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
        { email: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    })
      .select('name email _id')
      .limit(5);

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

    return res.status(200).json({ ok: true, msg: 'Push token actualizado correctamente' });
  } catch (error) {
    console.error('Error en updatePushToken:', error);
    return res.status(500).json({ ok: false, msg: 'Error al actualizar push token' });
  }
};