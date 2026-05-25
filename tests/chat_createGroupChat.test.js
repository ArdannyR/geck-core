import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/models/Chat.js', () => ({
  default: { create: jest.fn() }
}));

const { createGroupChat } = await import('../src/controllers/chat_controller.js');

describe('Chat Controller - createGroupChat', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { 
      user: { _id: 'user123', id: 'user123' }, 
      body: {} 
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('chat - 1. Debería retornar error 400 si se envían menos de 2 usuarios invitados para el grupo', async () => {
    req.body = { users: ['solo_un_invitado'], name: 'Mi Grupo' };

    await createGroupChat(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      ok: false, 
      msg: 'Se requieren al menos 2 usuarios extra para un grupo' 
    });
  });
});