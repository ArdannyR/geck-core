import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// ─── MOCKS (deben ir antes de cualquier import de los módulos mockeados) ───────

let mockWorkspaceFindById;
jest.unstable_mockModule('../src/models/Workspace.js', () => {
  const mock = jest.fn();
  mockWorkspaceFindById = jest.fn();
  mock.findById = mockWorkspaceFindById;
  mock.findOne = jest.fn();
  mock.find = jest.fn();
  return { default: mock };
});

let mockUserFindById, mockUserFindOne;
jest.unstable_mockModule('../src/models/User.js', () => {
  mockUserFindById = jest.fn();
  mockUserFindOne = jest.fn();
  return {
    default: {
      findById: mockUserFindById,
      findOne: mockUserFindOne,
      find: jest.fn(),
      findByIdAndUpdate: jest.fn()
    }
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

// ─── IMPORTS (después de todos los mocks) ─────────────────────────────────────

const { createWorkspace, inviteMember } = await import('../src/controllers/workspace_controller.js');

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('Workspace Controller - createWorkspace', () => {
  let req, res;
  const validId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
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
});

describe('Workspace Controller - inviteMember', () => {
  let req, res;
  const validId = new mongoose.Types.ObjectId().toString();
  const workspaceId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { _id: validId, name: 'Test User' },
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('Debería retornar error 404 si el workspace no existe', async () => {
    req.body = { workspaceId: 'idFalso', email: 'invitado@test.com' };

    // Usuario SÍ existe
    mockUserFindOne.mockResolvedValue({ _id: 'user123', email: 'invitado@test.com' });

    // Workspace NO existe
    mockWorkspaceFindById.mockResolvedValue(null);

    await inviteMember(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Workspace no encontrado' });
  });

  test('Debería invitar exitosamente y retornar 200', async () => {
    const invitedUserId = new mongoose.Types.ObjectId().toString();
    req.body = { workspaceId, email: 'invitado@test.com' };

    const mockWorkspaceData = {
      _id: workspaceId,
      name: 'Mi Workspace',
      owner: validId,
      members: [validId],
      pendingInvites: [],
      save: jest.fn().mockResolvedValue(true)
    };

    mockWorkspaceFindById.mockResolvedValue(mockWorkspaceData);
    mockUserFindOne.mockResolvedValue({ _id: invitedUserId, name: 'Invitado', email: 'invitado@test.com' });

    await inviteMember(req, res);

    expect(mockWorkspaceData.save).toHaveBeenCalled();
    expect(mockMail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, msg: expect.stringContaining('Invitación enviada') })
    );
  });
});