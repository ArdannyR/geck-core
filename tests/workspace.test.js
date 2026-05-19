import { jest } from '@jest/globals';
import mongoose from 'mongoose';

let mockWorkspaceFindById;

jest.unstable_mockModule('../src/models/Workspace.js', () => {
  const mock = jest.fn();
  mockWorkspaceFindById = jest.fn();
  mock.findById = mockWorkspaceFindById;
  mock.findOne = jest.fn();
  mock.find = jest.fn();
  return { default: mock };
});

let mockUserFindOne;

jest.unstable_mockModule('../src/models/User.js', () => {
  mockUserFindOne = jest.fn();
  return {
    default: { findById: jest.fn(), findOne: mockUserFindOne, find: jest.fn(), findByIdAndUpdate: jest.fn() }
  };
});

jest.unstable_mockModule('../src/models/Chat.js', () => {
  const mock = jest.fn();
  mock.findById = jest.fn();
  mock.findOne = jest.fn();
  mock.find = jest.fn();
  mock.create = jest.fn();
  mock.findByIdAndUpdate = jest.fn();
  return { default: mock };
});

let mockMail;

jest.unstable_mockModule('../src/helpers/mail.js', () => {
  mockMail = jest.fn();
  return { sendWorkspaceInviteEmail: mockMail };
});

const { createWorkspace, inviteMember } = await import('../src/controllers/workspace_controller.js');

describe('Workspace Controller - createWorkspace', () => {
  let req, res;
  const validId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    // Eliminamos la línea de User.findById que causaba el ReferenceError
    req = {
      user: { _id: validId },
      body: {},
      app: { get: jest.fn().mockReturnValue(null) }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('Debería retornar error 400 si no se envía nombre', async () => {
    req.body = {};

    await createWorkspace(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'El nombre es obligatorio' });
  });

  // Eliminamos la prueba de "inviteMember" que la IA pegó aquí por accidente
});

test('Debería retornar error 404 si el workspace no existe', async () => {
    req.body = { workspaceId, email: 'invitado@test.com' };
    
    // 1. AÑADIMOS ESTO: Simulamos que el usuario SÍ existe usando la variable del mock
    mockUserFindOne.mockResolvedValue({ _id: 'user123', email: 'invitado@test.com' });

    // 2. Simulamos que el Workspace NO existe
    mockWorkspaceFindById.mockResolvedValue(null);

    await inviteMember(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Workspace no encontrado' });
  });
