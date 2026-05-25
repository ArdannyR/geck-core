import { jest } from '@jest/globals';
import mongoose from 'mongoose';

let mockUserFindById;

jest.unstable_mockModule('../src/models/User.js', () => {
  mockUserFindById = jest.fn();
  return {
    default: {
      findById: mockUserFindById
    }
  };
});

const { getProfile, updateProfile } = await import('../src/controllers/user_controller.js');

describe('User Controller - Profile Info', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { user: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('user - 1. getProfile debería retornar 200 y ocultar la contraseña en la respuesta', () => {
    req.user = {
      name: 'Usuario Test',
      password: 'hashed_password_secreta',
      email: 'usuario@test.com',
      toObject: () => ({ name: 'Usuario Test', password: 'hashed_password_secreta', email: 'usuario@test.com' })
    };

    getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      nombre: 'Usuario Test',
      email: 'usuario@test.com'
    });
    expect(res.json.mock.calls[0][0].password).toBeUndefined();
  });

  test('user - 2. updateProfile debería retornar 400 si el ID del usuario no es válido', async () => {
    req.user = { _id: 'id_invalido_123' };
    req.body = { nombre: 'Nuevo Nombre', email: 'nuevo@test.com' };

    await updateProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ msg: expect.stringContaining('ID inválido') }));
  });
});