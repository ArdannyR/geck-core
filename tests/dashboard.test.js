/*
 * Archivo de Pruebas: Módulo de Dashboard
 * Propósito: Verificar el acceso compartido al escritorio.
 * Resultados esperados: 
 * - Camino feliz: Respuesta 200 confirmando acceso concedido.
 * - Camino triste: Respuesta 400 ante falta de correo electrónico.
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';

const mockUserFindOne = jest.fn();

jest.unstable_mockModule('../src/models/User.js', () => ({
  default: { findById: jest.fn(), findOne: mockUserFindOne, find: jest.fn(), findByIdAndUpdate: jest.fn() }
}));

jest.unstable_mockModule('../src/models/Workspace.js', () => ({
  default: { findById: jest.fn(), find: jest.fn() }
}));

const { shareDesktopAccess } = await import('../src/controllers/dashboard_controller.js');

describe('Dashboard Controller - shareDashboardAccess', () => {
  let req, res;
  const ownerId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { _id: ownerId },
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('Debería retornar error 400 si no se envía email', async () => {
    req.body = {};

    await shareDesktopAccess(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Debes ingresar un correo.' });
  });

  test('Debería compartir acceso exitosamente y retornar 200', async () => {
    const invitedId = new mongoose.Types.ObjectId().toString();
    req.body = { email: 'invitado@test.com' };

    const mockInvitedUser = {
      _id: invitedId,
      name: 'Invitado',
      email: 'invitado@test.com',
      savedDesktops: [],
      save: jest.fn().mockResolvedValue(true)
    };

    mockUserFindOne.mockResolvedValue(mockInvitedUser);

    await shareDesktopAccess(req, res);

    expect(mockInvitedUser.savedDesktops).toContain(ownerId);
    expect(mockInvitedUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, msg: expect.stringContaining('Acceso concedido') })
    );
  });
});
