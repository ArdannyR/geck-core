/*
 * Archivo de Pruebas: Módulo de Chat
 * Propósito: Verificar el acceso a chats, envío de mensajes y obtención de mensajes.
 * Resultados esperados: 
 * - Camino feliz: Respuestas 200/201 con datos del chat y mensajes.
 * - Camino triste: Respuestas 400/404 ante datos faltantes o chats inexistentes.
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';

const mockChat = jest.fn();
mockChat.findById = jest.fn();
mockChat.findOne = jest.fn();
mockChat.find = jest.fn();
mockChat.create = jest.fn();
mockChat.findByIdAndUpdate = jest.fn();

const mockMessage = jest.fn();
mockMessage.create = jest.fn();
mockMessage.find = jest.fn();
mockMessage.findById = jest.fn();
mockMessage.countDocuments = jest.fn();

const mockSendPushNotification = jest.fn();

jest.unstable_mockModule('../src/models/Chat.js', () => ({
  default: mockChat
}));

jest.unstable_mockModule('../src/models/Message.js', () => ({
  default: mockMessage
}));

jest.unstable_mockModule('../src/models/User.js', () => ({
  default: { findById: jest.fn(), findOne: jest.fn(), find: jest.fn(), findByIdAndUpdate: jest.fn() }
}));

jest.unstable_mockModule('../src/helpers/expo_push.js', () => ({
  sendPushNotification: mockSendPushNotification
}));

const { accessChat, sendMessage, fetchMessages } = await import('../src/controllers/chat_controller.js');

describe('Chat Controller - accessChat', () => {
  let req, res;
  const myId = new mongoose.Types.ObjectId().toString();
  const otherId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { _id: myId },
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('Debería retornar error 400 si falta el userId del destinatario', async () => {
    req.body = {};

    await accessChat(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      msg: 'El userId del destinatario es requerido en el body'
    });
  });

  test('Debería retornar el chat existente y responder 200', async () => {
    req.body = { userId: otherId };

    const mockChatData = {
      _id: new mongoose.Types.ObjectId(),
      isGroup: false,
      participants: [
        { _id: myId, name: 'Yo', email: 'yo@test.com', avatarUrl: null },
        { _id: otherId, name: 'Otro', email: 'otro@test.com', avatarUrl: null }
      ]
    };

    mockChat.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockChatData)
    });

    await accessChat(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true, chat: mockChatData });
  });
});

describe('Chat Controller - sendMessage', () => {
  let req, res;
  const myId = new mongoose.Types.ObjectId().toString();
  const chatId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { _id: myId, name: 'Test User' },
      body: {},
      app: { get: jest.fn().mockReturnValue(null) }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('Debería retornar error 400 si faltan chatId o content', async () => {
    req.body = { chatId: '', content: '' };

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      msg: 'chatId y content son requeridos'
    });
  });

  test('Debería enviar el mensaje exitosamente y retornar 201', async () => {
    req.body = { chatId, content: 'Hola, ¿cómo estás?' };

    mockChat.findById.mockResolvedValue({
      _id: chatId,
      participants: [myId, new mongoose.Types.ObjectId().toString()],
      save: jest.fn()
    });

    const populatedMessage = {
      _id: new mongoose.Types.ObjectId(),
      chatId,
      senderId: { _id: myId, name: 'Test User', email: 'test@test.com', avatarUrl: null },
      content: 'Hola, ¿cómo estás?'
    };

    const mockMessageData = {
      ...populatedMessage,
      senderId: myId,
      populate: jest.fn().mockResolvedValue(populatedMessage)
    };

    mockMessage.create.mockResolvedValue(mockMessageData);
    mockChat.findByIdAndUpdate.mockResolvedValue(true);

    const UserMod = await import('../src/models/User.js');
    UserMod.default.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });

    await sendMessage(req, res);

    expect(mockMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({ chatId, senderId: myId, content: 'Hola, ¿cómo estás?' })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, message: populatedMessage })
    );
  });
});

describe('Chat Controller - fetchMessages', () => {
  let req, res;
  const myId = new mongoose.Types.ObjectId().toString();
  const chatId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { _id: myId },
      params: { chatId },
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('Debería retornar error 404 si el chat no existe', async () => {
    mockChat.findById.mockResolvedValue(null);

    await fetchMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Chat no encontrado' });
  });

  test('Debería obtener mensajes exitosamente y retornar 200', async () => {
    const mockMessages = [
      {
        _id: new mongoose.Types.ObjectId(),
        chatId,
        senderId: { _id: myId, name: 'Test', email: 'test@test.com', avatarUrl: null },
        content: 'Mensaje 1'
      },
      {
        _id: new mongoose.Types.ObjectId(),
        chatId,
        senderId: { _id: myId, name: 'Test', email: 'test@test.com', avatarUrl: null },
        content: 'Mensaje 2'
      }
    ];

    mockChat.findById.mockResolvedValue({
      _id: chatId,
      participants: [myId]
    });

    mockMessage.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockMessages)
    });

    mockMessage.countDocuments.mockResolvedValue(2);

    await fetchMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        messages: mockMessages,
        pagination: expect.objectContaining({ total: 2, page: 1 })
      })
    );
  });
});
