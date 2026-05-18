import Item from '../models/item.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import mongoose from 'mongoose';
import { uploadFileToCloudinary } from '../helpers/cloudinary.js';

// getDesktop, createItem, uploadFileItem, getItemById, updateBulkPositions, updateItem, deleteItem, getAllItems

export const getDesktop = async (req, res) => {
  try {
    const myId = req.user._id;
    let { remoteUserId, folderId, workspaceId } = req.query;

    if (workspaceId && workspaceId !== 'null' && workspaceId !== 'undefined') {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) return res.status(404).json({ ok: false, msg: 'Workspace no encontrado' });

      const isMember = workspace.members.includes(myId);
      if (!isMember) return res.status(403).json({ ok: false, msg: 'No tienes acceso a este espacio' });

      const queryWS = { workspaceId: workspaceId };
      if (folderId && folderId !== 'null') {
        queryWS.parentId = folderId;
      } else {
        queryWS.$or = [{ parentId: null }, { parentId: { $exists: false } }];
      }

      const items = await Item.find(queryWS).lean();
      return res.status(200).json({ ok: true, items });
    }

    const isRemoteMode = remoteUserId && remoteUserId !== 'undefined' && remoteUserId !== 'null' && String(remoteUserId) !== String(myId);
    const targetUserId = isRemoteMode ? remoteUserId : myId;

    if (isRemoteMode) {
      const me = await User.findById(myId);
      const hasPermission = me.savedDesktops.some(id => String(id) === String(targetUserId));

      if (!hasPermission) {
        return res.status(403).json({ ok: false, msg: 'No tienes permiso para ver este escritorio.' });
      }
    }

    const query = { userId: targetUserId };
    if (folderId && folderId !== 'null' && folderId !== 'undefined') {
      query.parentId = folderId;
    } else {
      query.$or = [{ parentId: null }, { parentId: { $exists: false } }];
    }

    let items = [];
    if (!isRemoteMode && (!folderId || folderId === 'null' || folderId === 'undefined')) {
      items = await Item.find({
        $or: [
          query,
          { 'sharedWith.userId': myId }
        ]
      }).lean();
    } else {
      items = await Item.find(query).lean();
    }

    if (items.length > 0) {
      items = items.map(item => {
        if (String(item.userId) !== String(myId) && item.guestPositions) {
          const myPos = item.guestPositions.find(gp => String(gp.userId) === String(myId));
          if (myPos) item.position = { x: myPos.x, y: myPos.y };
        }
        return item;
      });
    }

    const ownerSettings = await User.findById(targetUserId).select('preferences');

    return res.status(200).json({
      ok: true,
      items,
      preferences: ownerSettings?.preferences
    });
  } catch (error) {
    console.error('Error en getDesktop:', error);
    return res.status(500).json({ ok: false, msg: error.message });
  }
};

export const createItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, name, url, parentId, x, y, workspaceId } = req.body;

    if (!type || !name) return res.status(400).json({ ok: false, msg: 'Tipo y nombre son obligatorios' });
    if (type === 'link' && !url) return res.status(400).json({ ok: false, msg: 'La URL es obligatoria para enlaces' });

    const newItem = new Item({
      userId,
      type,
      name,
      url: url || null,
      parentId: (parentId && parentId !== 'null') ? parentId : null,
      position: { x: x ?? 100, y: y ?? 100 },
      workspaceId: (workspaceId && workspaceId !== 'null') ? workspaceId : null
    });

    await newItem.save();

    const io = req.app.get('io');
    if (io) {
      if (workspaceId) {
        io.to(`workspace:${workspaceId}`).emit('item-created', newItem);
      } else {
        io.to(`user:${userId}`).emit('item-created', newItem);
      }
      if (newItem.sharedWith && newItem.sharedWith.length > 0) {
        newItem.sharedWith.forEach(s => io.to(`user:${s.userId}`).emit('item-created', newItem));
      }
    }

    return res.status(201).json({ ok: true, msg: 'Ítem creado exitosamente', item: newItem });
  } catch (error) {
    return res.status(500).json({ ok: false, msg: `Error en el servidor - ${error}` });
  }
};

export const uploadFileItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { parentId, x, y, workspaceId } = req.body;

    if (!req.files || !req.files.archivo) {
      return res.status(400).json({ ok: false, msg: 'No se ha seleccionado ningún archivo.' });
    }

    const file = req.files.archivo;

    const cloudData = await uploadFileToCloudinary(file.tempFilePath, 'VirtualDesk_Docs');

    const newItem = new Item({
      userId,
      type: 'file',
      name: file.name,
      url: cloudData.secure_url,
      fileFormat: cloudData.format || file.name.split('.').pop(),
      publicId: cloudData.public_id,
      parentId: (parentId && parentId !== 'null') ? parentId : null,
      position: { x: Number(x) || 100, y: Number(y) || 100 },
      workspaceId: (workspaceId && workspaceId !== 'null') ? workspaceId : null
    });

    await newItem.save();

    const io = req.app.get('io');
    if (io) {
      if (workspaceId) io.to(`workspace:${workspaceId}`).emit('item-created', newItem);
      else io.to(`user:${userId}`).emit('item-created', newItem);
    }

    return res.status(201).json({ ok: true, msg: 'Archivo subido exitosamente', item: newItem });
  } catch (error) {
    console.log('Error real de subida:', error);
    return res.status(500).json({ ok: false, msg: 'Error al subir el archivo', error: error.message });
  }
};

export const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ ok: false, msg: 'Ítem no encontrado' });
    return res.status(200).json({ ok: true, item });
  } catch (error) {
    return res.status(500).json({ ok: false, msg: error.message });
  }
};

export const updateBulkPositions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { items } = req.body;

    if (!items || !Array.isArray(items)) return res.status(400).json({ ok: false, msg: 'Formato de datos incorrecto' });

    const operations = items.map(item => ({
      updateOne: {
        filter: { _id: item.id, userId },
        update: { $set: { 'position.x': item.x, 'position.y': item.y } }
      }
    }));

    if (operations.length > 0) await Item.bulkWrite(operations);

    return res.status(200).json({ ok: true, msg: 'Escritorio organizado guardado' });
  } catch (error) {
    return res.status(500).json({ ok: false, msg: error.message });
  }
};

export const deleteItem = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { id } = req.params;

    const root = await Item.findOne({ _id: id, userId }).session(session).lean();
    if (!root) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ ok: false, msg: 'No existe este ítem o no pertenece al usuario' });
    }

    const toDelete = new Set([String(id)]);
    const queue = [id];
    let guard = 0;

    while (queue.length) {
      guard++;
      if (guard > 5000) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ ok: false, msg: 'Árbol demasiado grande o ciclo detectado' });
      }

      const parentId = queue.shift();
      const children = await Item.find({ parentId, userId }).session(session).select('_id').lean();
      for (const ch of children) {
        const chId = String(ch._id);
        if (!toDelete.has(chId)) {
          toDelete.add(chId);
          queue.push(ch._id);
        }
      }
    }

    const idsArray = Array.from(toDelete);
    await Item.deleteMany({ _id: { $in: idsArray }, userId }).session(session);

    await session.commitTransaction();
    session.endSession();

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userId}`).emit('item-deleted', { id, deleted: idsArray.length, ids: idsArray });
      if (root.sharedWith && root.sharedWith.length > 0) {
        root.sharedWith.forEach(s => io.to(`user:${s.userId}`).emit('item-deleted', { id, deleted: idsArray.length, ids: idsArray }));
      }
    }

    return res.status(200).json({ ok: true, msg: 'Ítem eliminado correctamente', deleted: idsArray.length });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ ok: false, msg: `Error en el servidor - ${error.message}` });
  }
};

export const updateItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { name, x, y, email, permission } = req.body;

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ ok: false, msg: 'Ítem no encontrado' });

    const isOwner = String(item.userId) === String(userId);
    const isShared = item.sharedWith.some(s => String(s.userId) === String(userId));

    // Renombrar (solo propietario)
    if (name !== undefined) {
      if (!isOwner) return res.status(403).json({ ok: false, msg: 'No tienes permiso para renombrar este ítem' });
      if (!String(name).trim()) return res.status(400).json({ ok: false, msg: 'El nombre no puede estar vacío' });
      item.name = String(name).trim();
    }

    // Mover posición
    if (x !== undefined || y !== undefined) {
      if (!isOwner && !isShared) return res.status(403).json({ ok: false, msg: 'No tienes permiso para mover esto' });

      if (isOwner) {
        if (x !== undefined) item.position.x = Number(x);
        if (y !== undefined) item.position.y = Number(y);
      } else {
        const guestPosIndex = item.guestPositions.findIndex(gp => String(gp.userId) === String(userId));
        if (guestPosIndex >= 0) {
          if (x !== undefined) item.guestPositions[guestPosIndex].x = Number(x);
          if (y !== undefined) item.guestPositions[guestPosIndex].y = Number(y);
        } else {
          item.guestPositions.push({
            userId,
            x: Number(x ?? item.position.x),
            y: Number(y ?? item.position.y)
          });
        }
      }
    }

    // Compartir (solo propietario)
    if (email !== undefined || permission !== undefined) {
      if (!isOwner) return res.status(403).json({ ok: false, msg: 'No puedes compartir este ítem (no eres propietario)' });
      if (!email) return res.status(400).json({ msg: 'Email requerido' });
      if (!permission || !['read', 'edit'].includes(permission)) return res.status(400).json({ msg: 'Permiso inválido (read/edit)' });

      const invitedUser = await User.findOne({ email });
      if (!invitedUser) return res.status(404).json({ msg: 'Usuario invitado no existe' });
      if (String(invitedUser._id) === String(userId)) return res.status(400).json({ msg: 'No puedes compartir contigo mismo' });

      const index = item.sharedWith.findIndex(s => String(s.userId) === String(invitedUser._id));
      if (index >= 0) item.sharedWith[index].permission = permission;
      else item.sharedWith.push({ userId: invitedUser._id, permission });
    }

    await item.save();

    const io = req.app.get('io');
    if (io) {
      if (name !== undefined) {
        const payload = { id: item._id, name: item.name, parentId: item.parentId, position: item.position, type: item.type };
        io.to(`user:${userId}`).emit('item-renamed', payload);
        if (item.sharedWith?.length) {
          item.sharedWith.forEach(s => io.to(`user:${s.userId}`).emit('item-renamed', payload));
        }
      }

      if (x !== undefined || y !== undefined) {
        const payload = { id: item._id, position: { x: item.position.x, y: item.position.y } };
        if (item.workspaceId) {
          io.to(`workspace:${item.workspaceId}`).emit('item-moved', payload);
        } else {
          io.to(`user:${item.userId}`).emit('item-moved', payload);
          if (item.guestPositions && item.guestPositions.length > 0) {
            item.guestPositions.forEach(guest => io.to(`user:${guest.userId}`).emit('item-moved', payload));
          }
        }
      }

      if (email !== undefined) {
        io.to(`user:${invitedUser._id}`).emit('item-shared', item);
      }
    }

    return res.status(200).json({ ok: true, msg: 'Ítem actualizado correctamente', item });
  } catch (error) {
    return res.status(500).json({ ok: false, msg: `Error en el servidor - ${error.message}` });
  }
};

export const getAllItems = async (req, res) => {
  try {
    const userId = req.user._id;

    const items = await Item.find({
      $or: [
        { userId: userId },
        { 'sharedWith.userId': userId }
      ]
    }).lean();

    return res.status(200).json({
      ok: true,
      items
    });
  } catch (error) {
    console.error('Error en getAllItems:', error);
    return res.status(500).json({ ok: false, msg: error.message });
  }
};
