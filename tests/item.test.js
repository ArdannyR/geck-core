/*
 * Archivo de Pruebas: Módulo de Ítems
 * Propósito: Verificar la creación y actualización de ítems.
 * Resultados esperados: 
 * - Camino feliz: Respuestas 200/201 con confirmación de operación.
 * - Camino triste: Respuestas 400/404 ante datos inválidos o ítem inexistente.
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';

const mockItemFindById = jest.fn();
const mockItem = jest.fn();

jest.unstable_mockModule('../src/models/item.js', () => ({
  default: Object.assign(mockItem, { findById: mockItemFindById })
}));

jest.unstable_mockModule('../src/models/User.js', () => ({
  default: { findById: jest.fn(), findOne: jest.fn(), find: jest.fn() }
}));

const { createItem, updateItem } = await import('../src/controllers/item_controller.js');

describe('Item Controller - createItem', () => {
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

  test('Debería retornar error 400 si faltan tipo o nombre', async () => {
    req.body = { type: '', name: '' };

    await createItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Tipo y nombre son obligatorios' });
  });

  test('Debería crear un ítem exitosamente y retornar 201', async () => {
    req.body = { type: 'note', name: 'Mi Nota', x: 200, y: 300 };

    const savedItem = {
      _id: new mongoose.Types.ObjectId(),
      userId: validId,
      type: 'note',
      name: 'Mi Nota',
      url: null,
      parentId: null,
      position: { x: 200, y: 300 },
      workspaceId: null,
      sharedWith: []
    };

    const mockSave = jest.fn().mockResolvedValue(savedItem);
    mockItem.mockReturnValue({ save: mockSave });

    await createItem(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, msg: 'Ítem creado exitosamente' })
    );
  });
});

describe('Item Controller - updateItem', () => {
  let req, res;
  const validId = new mongoose.Types.ObjectId().toString();
  const itemId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { _id: validId },
      params: { id: itemId },
      body: {},
      app: { get: jest.fn().mockReturnValue(null) }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('Debería retornar error 404 si el ítem no existe', async () => {
    mockItemFindById.mockResolvedValue(null);

    await updateItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, msg: 'Ítem no encontrado' });
  });

  test('Debería actualizar el nombre exitosamente y retornar 200', async () => {
    const mockItemData = {
      _id: itemId,
      userId: validId,
      name: 'Viejo Nombre',
      position: { x: 100, y: 100 },
      guestPositions: [],
      sharedWith: [],
      workspaceId: null,
      save: jest.fn().mockResolvedValue(true)
    };

    mockItemFindById.mockResolvedValue(mockItemData);
    req.body = { name: 'Nuevo Nombre' };

    await updateItem(req, res);

    expect(mockItemData.name).toBe('Nuevo Nombre');
    expect(mockItemData.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, msg: 'Ítem actualizado correctamente' })
    );
  });
});
