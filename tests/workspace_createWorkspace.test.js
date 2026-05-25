import { jest } from '@jest/globals';

let mockWorkspaceSave = jest.fn();
jest.unstable_mockModule('../src/models/Workspace.js', () => {
  return {
    default: class Workspace {
      constructor(data) { Object.assign(this, data); }
      save = mockWorkspaceSave;
    }
  };
});

let mockChatSave = jest.fn();
jest.unstable_mockModule('../src/models/Chat.js', () => {
  return {
    default: class Chat {
      constructor(data) { Object.assign(this, data); }
      save = mockChatSave;
    }
  };
});

const { createWorkspace } = await import('../src/controllers/workspace_controller.js');

describe('Workspace Controller - createWorkspace', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { 
      user: { _id: 'owner123' }, 
      body: {},
      app: { get: jest.fn() } 
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('workspace - 1. Debería retornar error 400 si no se proporciona el nombre del workspace', async () => {
    req.body = {};

    await createWorkspace(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'El nombre es obligatorio' });
  });

  test('workspace - 2. Debería retornar 201 y crear exitosamente el workspace junto con su chat', async () => {
    req.body = { nombre: 'Nuevo Proyecto' };
    mockWorkspaceSave.mockResolvedValue(true);
    mockChatSave.mockResolvedValue(true);

    await createWorkspace(req, res);

    expect(mockWorkspaceSave).toHaveBeenCalled();
    expect(mockChatSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      msg: 'Espacio de trabajo y chat creados exitosamente'
    }));
  });
});