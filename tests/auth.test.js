import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// ─── MOCKS (siempre primero) ──────────────────────────────────────────────────

let mockUserFindOne;

jest.unstable_mockModule('../src/models/User.js', () => {
  mockUserFindOne = jest.fn();
  return {
    default: {
      findOne: mockUserFindOne,
      findById: jest.fn(),
      create: jest.fn(),
    }
  };
});

let mockSendRegistrationEmail;

jest.unstable_mockModule('../src/helpers/mail.js', () => {
  mockSendRegistrationEmail = jest.fn();
  return {
    sendRegistrationEmail: mockSendRegistrationEmail,
    sendPasswordRecoveryEmail: jest.fn(), };
});

let mockCreateJWT;

jest.unstable_mockModule('../src/helpers/jwt.js', () => {
  mockCreateJWT = jest.fn();
  return { createJWT: mockCreateJWT };
});

// ─── IMPORTS dinámicos (después de los mocks) ─────────────────────────────────

const { registerUser, loginUser } = await import('../src/controllers/auth_controller.js');

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('Auth Controller - loginUser', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('Debería retornar error 404 si el usuario no se encuentra registrado', async () => {
    req.body = { email: 'noexiste@test.com', password: '123' };

    mockUserFindOne.mockResolvedValue(null);

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ msg: 'El usuario no se encuentra registrado' });
  });

  test('Debería iniciar sesión correctamente y retornar el token JWT', async () => {
    req.body = { email: 'ardanny@test.com', password: 'password123' };

    const mockUser = {
      _id: 'user123',
      name: 'Ardanny',
      email: 'ardanny@test.com',
      role: 'student',
      emailConfirmed: true,
      matchPassword: jest.fn().mockResolvedValue(true)
    };

    mockUserFindOne.mockResolvedValue(mockUser);
    mockCreateJWT.mockReturnValue('mi_token_jwt_secreto');

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      token: 'mi_token_jwt_secreto',
      nombre: 'Ardanny',
      rol: 'student',
      _id: 'user123',
      email: 'ardanny@test.com'
    });
  });
});