import app from './app.js';
import connection from './database.js';
import http from 'http';
import rateLimit from 'express-rate-limit';
import Message from './models/Message.js';
import Chat from './models/Chat.js';
import { Server } from 'socket.io';
import { initCronJobs } from './helpers/cron_jobs.js';

const onlineUsers = new Map();

const startServer = async () => {
  await connection();

  initCronJobs();

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 250,
    message: { msg: 'Exceso de peticiones.' }
  });
  app.use(limiter);

  app.set('io', io);

  io.on('connection', (socket) => {
    console.log('Socket conectado:', socket.id);

    socket.on('join-workspace-room', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`Usuario unido a workspace room: workspace:${workspaceId}`);
    });

    socket.on('workspace-item-created', (data) => {
      socket.to(`workspace:${data.workspaceId}`).emit('item-created', data.item);
    });

    socket.on('workspace-item-moved', (data) => {
      socket.to(`workspace:${data.workspaceId}`).emit('item-moved', {
        id: data.id,
        position: data.position
      });
    });

    socket.on('workspace-item-renamed', (data) => {
      socket.to(`workspace:${data.workspaceId}`).emit('item-renamed', {
        id: data.id,
        name: data.name
      });
    });

    socket.on('workspace-item-deleted', (data) => {
      socket.to(`workspace:${data.workspaceId}`).emit('item-deleted', {
        ids: data.ids
      });
    });

    socket.on('workspace-window-open', (data) => {
      socket.to(`workspace:${data.workspaceId}`).emit('window-open', data.windowData);
    });

    socket.on('workspace-window-close', (data) => {
      socket.to(`workspace:${data.workspaceId}`).emit('window-close', { windowId: data.windowId });
    });

    socket.on('workspace-window-move', (data) => {
      socket.to(`workspace:${data.workspaceId}`).emit('window-move', {
        windowId: data.windowId,
        position: data.position
      });
    });

    socket.on('workspace-cursor-move', (data) => {
      socket.to(`workspace:${data.workspaceId}`).emit('cursor-move', {
        userId: data.userId,
        userName: data.userName,
        x: data.x,
        y: data.y
      });
    });

    socket.on('setup', (userId) => {
      socket.join(userId);

      onlineUsers.set(userId, socket.id);

      socket.broadcast.emit('user_online', { userId });

      socket.emit('setup_complete', { userId });
      console.log(`Usuario ${userId} configurado y en línea`);
    });

    socket.on('mark_delivered', async ({ messageId, userId, chatId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message || message.deliveredTo.includes(userId)) return;
        message.deliveredTo.push(userId);
        await message.save();

        const payload = { chatId, messageId, deliveredTo: message.deliveredTo, readBy: message.readBy };
        const chat = await Chat.findById(chatId);
        io.to(chatId.toString()).emit('message_status_update', payload);
        if (chat) {
          chat.participants.forEach(pid => {
            const pidStr = pid._id ? pid._id.toString() : pid.toString();
            io.to(pidStr).emit('message_status_update', payload);
          });
        }
      } catch (error) {
        console.error('Error en mark_delivered:', error);
      }
    });

    socket.on('mark_read', async ({ chatId, userId }) => {
      try {
        await Message.updateMany(
          { chatId, senderId: { $ne: userId }, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId, deliveredTo: userId } }
        );
        await Chat.findByIdAndUpdate(chatId, {
          $set: { [`unreadCounts.${userId}`]: 0 }
        });
        const updatedMessages = await Message.find({ chatId, senderId: { $ne: userId } })
                                             .select('_id deliveredTo readBy');
        const chat = await Chat.findById(chatId);
        const payload = { chatId, updatedMessages };
        io.to(chatId.toString()).emit('chat_status_bulk_update', payload);
        if (chat) {
          chat.participants.forEach(pid => {
            const pidStr = pid._id ? pid._id.toString() : pid.toString();
            io.to(pidStr).emit('chat_status_bulk_update', payload);
          });
        }
      } catch (error) {
        console.error('Error en mark_read:', error);
      }
    });

    socket.on('get_online_users', () => {
      socket.emit('online_users_list', Array.from(onlineUsers.keys()));
    });

    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`Usuario unido al chat: ${chatId}`);
    });

    socket.on('new_message', async (data) => {
      try {
        const { chatId, senderId, content, clientTimestamp } = data;

        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const messageData = {
          chatId,
          senderId,
          content,
          ...(clientTimestamp && { createdAt: new Date(clientTimestamp) })
        };

        const message = await Message.create(messageData);
        await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

        const populatedMessage = await message.populate('senderId', 'name email');

        chat.participants.forEach(participantId => {
          if (participantId.toString() !== senderId) {
            socket.to(participantId.toString()).emit('message_received', populatedMessage);
          }
        });

        socket.emit('message_sent', populatedMessage);
      } catch (error) {
        console.error('Error en new_message:', error);
      }
    });

    socket.on('edit_message', async (data) => {
      try {
        const { messageId, senderId, content } = data;

        const message = await Message.findById(messageId);
        if (!message || message.senderId.toString() !== senderId) return;

        message.content = content;
        message.isEdited = true;
        await message.save();

        const populatedMessage = await message.populate('senderId', 'name email');

        const chat = await Chat.findById(message.chatId);
        chat.participants.forEach(participantId => {
          socket.to(participantId.toString()).emit('message_edited', populatedMessage);
        });
      } catch (error) {
        console.error('Error en edit_message:', error);
      }
    });

    socket.on('delete_message', async (data) => {
      try {
        const { messageId, userId, type } = data;

        const message = await Message.findById(messageId);
        if (!message) return;

        if (type === 'for_me') {
          if (!message.deletedFor.includes(userId)) {
            message.deletedFor.push(userId);
            await message.save();
          }
          socket.emit('message_deleted_for_me', { messageId });
        } else {
          if (message.senderId.toString() !== userId) return;
          message.content = 'Mensaje eliminado';
          message.isDeleted = true;
          await message.save();

          const chat = await Chat.findById(message.chatId);
          chat.participants.forEach(participantId => {
            socket.to(participantId.toString()).emit('message_deleted_for_all', {
              messageId,
              content: 'Mensaje eliminado'
            });
          });
        }
      } catch (error) {
        console.error('Error en delete_message:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket desconectado:', socket.id);

      let disconnectedUserId = null;
      for (let [userId, sockId] of onlineUsers.entries()) {
        if (sockId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }

      // Clean up any remaining reference to this socket in case of duplicates
      for (let [userId, sockId] of onlineUsers.entries()) {
        if (sockId === socket.id) {
          onlineUsers.delete(userId);
        }
      }

      socket.removeAllListeners();

      if (disconnectedUserId) {
        socket.broadcast.emit('user_offline', { userId: disconnectedUserId });
        console.log(`Usuario ${disconnectedUserId} desconectado`);
      }
    });
  });

  server.listen(app.get('port'), '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${app.get('port')}`);
  });
};

startServer();
