import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// ─── MOCK (antes de cualquier import que dependa del modelo) ──────────────────

let mockUserFindById;

jest.unstable_mockModule('../src/models/User.js', () => {
  mockUserFindById = jest.fn();
  return {
    default: {
      findById: mockUserFindById,
    }
  };
});

// ─── IMPORTS (después de los mocks) ──────────────────────────────────────────

const { updateProfile } = await import('../src/controllers/user_controller.js');

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('User Controller - updateProfile', () => {
  let req, res;
  const validId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: { _id: validId },
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('Debería retornar error 400 si se envían campos vacíos', async () => {
    req.body = { name: '', email: 'ardanny@test.com' };

    // Usamos la referencia directa al mock, no User.findById
    mockUserFindById.mockResolvedValue({ _id: validId, email: 'ardanny@test.com' });

    await updateProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Debes llenar todos los campos' });
  });

  test('Debería actualizar el perfil correctamente y retornar código 200', async () => {
    req.body = { name: 'Ardanny Romero', email: 'ardanny@test.com' };

    const mockUser = {
      _id: validId,
      name: 'Ardanny',
      email: 'ardanny@test.com',
      save: jest.fn().mockResolvedValue(true)
    };

    mockUserFindById.mockResolvedValue(mockUser);

    await updateProfile(req, res);

    expect(mockUser.name).toBe('Ardanny Romero');
    expect(mockUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'Perfil actualizado correctamente' })
    );
  });
});