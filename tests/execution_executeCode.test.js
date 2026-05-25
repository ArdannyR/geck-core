import { jest } from '@jest/globals';

jest.unstable_mockModule('child_process', () => ({
  exec: jest.fn()
}));

jest.unstable_mockModule('fs-extra', () => ({
  default: { 
    ensureDir: jest.fn(), 
    writeFile: jest.fn(), 
    remove: jest.fn() 
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

  test('execution - 1. Debería retornar error 400 si no se envía el código o el lenguaje', async () => {
    req.body = { code: 'console.log("Hola");' };

    await executeCode(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      ok: false, 
      msg: 'El código y el lenguaje son obligatorios' 
    });
  });
});