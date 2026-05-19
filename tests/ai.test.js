import { jest } from '@jest/globals';

const mockAxiosPost = jest.fn();

jest.unstable_mockModule('axios', () => ({
  default: { post: mockAxiosPost }
}));

jest.unstable_mockModule('../src/models/User.js', () => ({
  default: { findById: jest.fn(), findOne: jest.fn(), find: jest.fn() }
}));

jest.unstable_mockModule('../src/models/item.js', () => ({
  default: { findById: jest.fn(), find: jest.fn() }
}));

const { chatWithAssistant } = await import('../src/controllers/ai_controller.js');

describe('AI Controller - chatWithAI', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('Debería retornar error 400 si no se envía mensaje', async () => {
    req.body = {};

    await chatWithAssistant(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'El mensaje es obligatorio' });
  });

  test('Debería responder exitosamente y retornar 200', async () => {
    req.body = { mensaje: 'Hola, ¿qué tal?' };

    mockAxiosPost.mockResolvedValue({
      data: { respuesta: '¡Hola! Estoy bien, ¿en qué puedo ayudarte?' }
    });

    await chatWithAssistant(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      data: '¡Hola! Estoy bien, ¿en qué puedo ayudarte?'
    });
  });
});
