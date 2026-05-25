import { jest } from '@jest/globals';

let mockUserFindOne;

jest.unstable_mockModule('../src/models/User.js', () => {
  mockUserFindOne = jest.fn();
  return {
    default: {
      findOne: mockUserFindOne
    }
  };
});

const { registerUser } = await import('../src/controllers/auth_controller.js');

describe('Auth Controller - registerUser', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('auth - 1. Debería retornar error 400 si hay campos vacíos al registrarse', async () => {
    req.body = { email: 'test@test.com', password: '', name: 'Nuevo Usuario' };

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Lo sentimos, debes llenar todos los campos' });
  });

  test('auth - 2. Debería retornar error 400 si el email ya existe y la cuenta está confirmada', async () => {
    req.body = { email: 'existe@test.com', password: '123', name: 'Usuario Existente' };
    mockUserFindOne.mockResolvedValue({ emailConfirmed: true });

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Lo sentimos, el email ya se encuentra registrado y confirmado' });
  });
});