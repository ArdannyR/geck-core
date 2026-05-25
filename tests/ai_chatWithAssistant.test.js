import { jest } from '@jest/globals';

jest.unstable_mockModule('axios', () => ({
  default: { post: jest.fn() }
}));

const { chatWithAssistant } = await import('../src/controllers/ai_controller.js');

describe('AI Controller - chatWithAssistant', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('ai - 1. Debería retornar error 400 si no se envía el campo "mensaje" en el body', async () => {
    req.body = {}; // Se omite intencionalmente el mensaje

    await chatWithAssistant(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      ok: false, 
      msg: 'El mensaje es obligatorio' 
    });
  });
});