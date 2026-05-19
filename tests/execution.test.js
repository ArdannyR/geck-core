import { jest } from '@jest/globals';

const mockExec = jest.fn();

jest.unstable_mockModule('child_process', () => ({
  exec: mockExec
}));

jest.unstable_mockModule('fs-extra', () => ({
  default: {
    ensureDir: jest.fn().mockResolvedValue(),
    writeFile: jest.fn().mockResolvedValue(),
    remove: jest.fn().mockResolvedValue()
  }
}));

const { executeCode } = await import('../src/controllers/execution_controller.js');

describe('Execution Controller - executeCode', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('Debería retornar error de compilación cuando el código falla', async () => {
    req.body = { code: 'console.log("hello"', language: 'javascript' };

    mockExec.mockImplementation((_command, _options, callback) => {
      callback(
        new Error('Command failed'),
        '',
        'script.js:1:25: error: unexpected token\n'
      );
    });

    await executeCode(req, res);
    await Promise.resolve();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, isError: true })
    );
  });

  test('Debería ejecutar código exitosamente y retornar 200', async () => {
    req.body = { code: 'console.log("Hola Mundo")', language: 'javascript' };

    mockExec.mockImplementation((_command, _options, callback) => {
      callback(null, 'Hola Mundo\n', '');
    });

    await executeCode(req, res);
    await Promise.resolve();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, output: 'Hola Mundo\n', isError: false })
    );
  });
});
