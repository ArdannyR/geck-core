import { jest } from '@jest/globals';

let mockWorkspaceFindById;

jest.unstable_mockModule('../src/models/Workspace.js', () => {
  mockWorkspaceFindById = jest.fn();
  return {
    default: {
      findById: mockWorkspaceFindById
    }
  };
});

const { leaveWorkspace } = await import('../src/controllers/workspace_controller.js');

describe('Workspace Controller - leaveWorkspace', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { 
      user: { _id: 'owner123' }, 
      params: { id: 'workspace123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('workspace -3. Debería retornar error 400 si el usuario dueño intenta salir del workspace en vez de eliminarlo', async () => {
    const mockWorkspace = {
      owner: 'owner123' // El ID coincide con el usuario en req.user._id
    };
    mockWorkspaceFindById.mockResolvedValue(mockWorkspace);

    await leaveWorkspace(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      msg: 'Eres el dueño. Debes eliminar el workspace, no salir de él.'
    });
  });
});