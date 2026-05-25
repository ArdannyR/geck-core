import { jest } from '@jest/globals';

let mockUserFindById;

jest.unstable_mockModule('../src/models/User.js', () => {
  mockUserFindById = jest.fn();
  return {
    default: {
      findById: mockUserFindById
    }
  };
});

const { updatePassword } = await import('../src/controllers/user_controller.js');

describe('User Controller - updatePassword', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { user: { _id: 'user123' }, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('user - 3. Debería retornar error 400 si falta la contraseña actual o nueva', async () => {
    req.body = { passwordactual: 'password_actual' }; 

    await updatePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Debes enviar el password actual y el nuevo' });
  });

  test('user - 4. Debería retornar error 404 si el usuario no es encontrado en la base de datos', async () => {
    req.body = { passwordactual: '123', passwordnuevo: '456' };
    mockUserFindById.mockResolvedValue(null);

    await updatePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Usuario no encontrado' });
  });

  test('user - 5. Debería retornar error 400 si la contraseña actual no hace match', async () => {
    req.body = { passwordactual: 'incorrecta', passwordnuevo: '456' };
    
    const mockUser = {
      matchPassword: jest.fn().mockResolvedValue(false)
    };
    mockUserFindById.mockResolvedValue(mockUser);

    await updatePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Lo sentimos, el password actual no es correcto' });
  });
});