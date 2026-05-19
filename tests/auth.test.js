import { jest } from '@jest/globals';
import { registerUser, loginUser } from '../src/controllers/auth_controller.js'; // <- Añadido loginUser
import User from '../src/models/User.js';
import { sendRegistrationEmail } from '../src/helpers/mail.js';
import { createJWT } from '../src/helpers/jwt.js'; // <- Nueva importación

jest.mock('../src/models/User.js');
jest.mock('../src/helpers/mail.js');
jest.mock('../src/helpers/jwt.js'); // <- Nuevo mock


describe('Auth Controller - loginUser', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    User.findOne = jest.fn();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  // PRUEBA 1: El camino triste (Usuario no existe)
  test('Debería retornar error 404 si el usuario no se encuentra registrado', async () => {
    req.body = { email: 'noexiste@test.com', password: '123' };
    
    // Simulamos que la base de datos no encuentra nada
    User.findOne.mockResolvedValue(null);

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ msg: 'El usuario no se encuentra registrado' });
  });

  // PRUEBA 2: El camino feliz (Login exitoso)
  test('Debería iniciar sesión correctamente y retornar el token JWT', async () => {
    req.body = { email: 'ardanny@test.com', password: 'password123' };

    // Simulamos el usuario perfecto que nos devuelve la base de datos
    const mockUser = {
      _id: 'user123',
      name: 'Ardanny',
      email: 'ardanny@test.com',
      role: 'student',
      emailConfirmed: true, // Debe estar confirmado para pasar la validación
      matchPassword: jest.fn().mockResolvedValue(true) // Simulamos que la contraseña sí coincide
    };

    User.findOne.mockResolvedValue(mockUser);
    
    // Simulamos que el helper nos genera un token
    createJWT.mockReturnValue('mi_token_jwt_secreto');

    await loginUser(req, res);

    // Verificamos que todo haya salido bien (Código 200)
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