import { jest } from '@jest/globals';

let mockItemFindById;

jest.unstable_mockModule('../src/models/item.js', () => {
  mockItemFindById = jest.fn();
  return {
    default: { findById: mockItemFindById }
  };
});

const { getItemById } = await import('../src/controllers/item_controller.js');

describe('Item Controller - getItemById', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { 
      user: { _id: 'user123' }, 
      params: { id: 'item_inexistente_123' } 
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('item - 2. Debería retornar error 404 si el ítem buscado no existe en la base de datos', async () => {
    mockItemFindById.mockResolvedValue(null);

    await getItemById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ 
      ok: false, 
      msg: 'Ítem no encontrado' 
    });
  });
});