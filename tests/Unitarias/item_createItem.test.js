import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/models/item.js', () => {
  return {
    default: class Item {
      constructor(data) { Object.assign(this, data); }
      save = jest.fn().mockResolvedValue(true);
    }
  };
});

const { createItem } = await import('../../src/controllers/item_controller.js');

describe('Item Controller - createItem', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { 
      user: { _id: 'user123' }, 
      body: {},
      app: { get: jest.fn() } 
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('item - 1. Debería retornar error 400 si el tipo de ítem es "link" pero no se proporciona una URL', async () => {
    req.body = { type: 'link', name: 'Mi Enlace' }; 

    await createItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      ok: false, 
      msg: 'La URL es obligatoria para enlaces' 
    });
  });
});