import { jest } from '@jest/globals';
import { updateProfile } from '../src/controllers/user_controller.js';
import User from '../src/models/User.js';
import mongoose from 'mongoose';

// Simulamos el modelo de Base de Datos
jest.mock('../src/models/User.js');

describe('User Controller - updateProfile', () => {
  let req, res;
  // Mongoose requiere que el ID tenga un formato válido de 24 caracteres hex
  const validId = new mongoose.Types.ObjectId().toString(); 

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Simulamos la request. Recuerda que el middleware de auth ya inyectó el 'user'
    req = {
      user: { _id: validId },
      body: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  // PRUEBA 1: El camino triste (Campos vacíos)
  test('Debería retornar error 400 si se envían campos vacíos', async () => {
    req.body = { name: '', email: 'ardanny@test.com' };

    // Simulamos que el usuario sí existe en la base de datos
    User.findById.mockResolvedValue({ _id: validId, email: 'ardanny@test.com' });

    await updateProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Debes llenar todos los campos' });
  });

  // PRUEBA 2: El camino feliz (Actualización exitosa)
  test('Debería actualizar el perfil correctamente y retornar código 200', async () => {
    req.body = { name: 'Ardanny Romero', email: 'ardanny@test.com' };

    // Creamos el mock del usuario que devuelve la DB, incluyendo la función save()
    const mockUser = {
      _id: validId,
      name: 'Ardanny',
      email: 'ardanny@test.com',
      save: jest.fn().mockResolvedValue(true)
    };

    User.findById.mockResolvedValue(mockUser);

    await updateProfile(req, res);

    // Verificamos que el controlador haya modificado el nombre en el objeto
    expect(mockUser.name).toBe('Ardanny Romero');
    
    // Verificamos que se haya intentado guardar en la base de datos
    expect(mockUser.save).toHaveBeenCalled();
    
    // Verificamos la respuesta final
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      msg: 'Perfil actualizado correctamente'
    }));
  });
});