import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import config from '../config.js';
import { getPool, sql } from '../db.js';
import { parseJson, stringifyJson } from '../utils/json.js';

const router = Router();
const schema = config.schema;

const mapRowToForm = (row) => ({
  id: row.id,
  external_id: row.external_id,
  title: row.title,
  description: row.description,
  fields: parseJson(row.fields_json, []),
  fields_json: row.fields_json,
  isActive: Boolean(row.is_active),
  is_active: Boolean(row.is_active),
  settings: parseJson(row.settings_json, {}),
  styling: parseJson(row.styling_json, {}),
  created_by_user_id: row.created_by_user_id,
  created_at: row.created_at,
  updated_at: row.updated_at,
  created_date: row.created_at,
  updated_date: row.updated_at,
  data_json: parseJson(row.data_json, null)
});

router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`SELECT * FROM ${schema}.forms WITH (NOLOCK) ORDER BY created_at DESC`);

    res.json(result.recordset.map(mapRowToForm));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`SELECT * FROM ${schema}.forms WITH (NOLOCK) WHERE id = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Formulário não encontrado' });
    }

    res.json(mapRowToForm(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {};
    const id = body.id || uuid();
    const pool = await getPool();
    const request = pool.request();

    request.input('id', sql.UniqueIdentifier, id);
    request.input('external_id', sql.NVarChar(50), body.external_id || body.externalId || null);
    request.input('title', sql.NVarChar(200), body.title || '');
    request.input('description', sql.NVarChar(sql.MAX), body.description || null);
    request.input('fields_json', sql.NVarChar(sql.MAX), stringifyJson(body.fields || body.fields_json || []));
    request.input('is_active', sql.Bit, body.isActive ?? body.is_active ?? true ? 1 : 0);
    request.input('settings_json', sql.NVarChar(sql.MAX), stringifyJson(body.settings || body.settings_json || {}));
    request.input('styling_json', sql.NVarChar(sql.MAX), stringifyJson(body.styling || body.styling_json || {}));
    request.input('created_by_user_id', sql.UniqueIdentifier, body.created_by_user_id || body.createdByUserId || null);
    request.input('data_json', sql.NVarChar(sql.MAX), stringifyJson(body));

    const insertQuery = `
      INSERT INTO ${schema}.forms (
        id, external_id, title, description, fields_json, is_active,
        settings_json, styling_json, created_by_user_id, data_json
      )
      OUTPUT INSERTED.*
      VALUES (
        @id, @external_id, @title, @description, @fields_json, @is_active,
        @settings_json, @styling_json, @created_by_user_id, @data_json
      )`;

    const result = await request.query(insertQuery);
    res.status(201).json(mapRowToForm(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const body = req.body || {};
    const pool = await getPool();
    const request = pool.request();

    request.input('id', sql.UniqueIdentifier, req.params.id);
    if (body.external_id !== undefined || body.externalId !== undefined) {
      request.input('external_id', sql.NVarChar(50), body.external_id || body.externalId);
    }
    if (body.title !== undefined) {
      request.input('title', sql.NVarChar(200), body.title);
    }
    if (body.description !== undefined) {
      request.input('description', sql.NVarChar(sql.MAX), body.description);
    }
    if (body.fields !== undefined || body.fields_json !== undefined) {
      request.input('fields_json', sql.NVarChar(sql.MAX), stringifyJson(body.fields || body.fields_json));
    }
    if (body.isActive !== undefined || body.is_active !== undefined) {
      const flag = body.isActive ?? body.is_active;
      request.input('is_active', sql.Bit, flag ? 1 : 0);
    }
    if (body.settings !== undefined || body.settings_json !== undefined) {
      request.input('settings_json', sql.NVarChar(sql.MAX), stringifyJson(body.settings || body.settings_json));
    }
    if (body.styling !== undefined || body.styling_json !== undefined) {
      request.input('styling_json', sql.NVarChar(sql.MAX), stringifyJson(body.styling || body.styling_json));
    }
    if (body.created_by_user_id !== undefined || body.createdByUserId !== undefined) {
      request.input('created_by_user_id', sql.UniqueIdentifier, body.created_by_user_id || body.createdByUserId);
    }
    request.input('data_json', sql.NVarChar(sql.MAX), stringifyJson(body));

    const sets = [];
    if (body.external_id !== undefined || body.externalId !== undefined) sets.push('external_id = @external_id');
    if (body.title !== undefined) sets.push('title = @title');
    if (body.description !== undefined) sets.push('description = @description');
    if (body.fields !== undefined || body.fields_json !== undefined) sets.push('fields_json = @fields_json');
    if (body.isActive !== undefined || body.is_active !== undefined) sets.push('is_active = @is_active');
    if (body.settings !== undefined || body.settings_json !== undefined) sets.push('settings_json = @settings_json');
    if (body.styling !== undefined || body.styling_json !== undefined) sets.push('styling_json = @styling_json');
    if (body.created_by_user_id !== undefined || body.createdByUserId !== undefined) sets.push('created_by_user_id = @created_by_user_id');
    sets.push('data_json = @data_json');
    sets.push('updated_at = SYSDATETIME()');

    if (sets.length === 0) {
      return res.status(400).json({ message: 'Nenhum dado para atualizar' });
    }

    const updateQuery = `
      UPDATE ${schema}.forms
      SET ${sets.join(', ')}
      WHERE id = @id;
      SELECT * FROM ${schema}.forms WITH (NOLOCK) WHERE id = @id`;

    const result = await request.query(updateQuery);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Formulário não encontrado' });
    }

    res.json(mapRowToForm(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`DELETE FROM ${schema}.forms WHERE id = @id`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Formulário não encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
