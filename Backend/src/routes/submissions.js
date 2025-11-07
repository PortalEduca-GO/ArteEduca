import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import config from '../config.js';
import { getPool, sql } from '../db.js';
import { parseJson, stringifyJson } from '../utils/json.js';

const router = Router();
const schema = config.schema;

const mapRowToSubmission = (row) => ({
  id: row.id,
  external_id: row.external_id,
  formId: row.form_id,
  form_id: row.form_id,
  data: parseJson(row.data_json, {}),
  data_json: row.data_json,
  submitterName: row.submitter_name,
  submitterEmail: row.submitter_email,
  submitted_at: row.submitted_at,
  created_date: row.submitted_at,
  updated_date: row.submitted_at
});

router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    let query = `SELECT * FROM ${schema}.form_submissions WITH (NOLOCK)`;

    if (req.query.formId || req.query.form_id) {
      query += ' WHERE form_id = @form_id';
      request.input('form_id', sql.UniqueIdentifier, req.query.formId || req.query.form_id);
    }

    query += ' ORDER BY submitted_at DESC';

    const result = await request.query(query);
    res.json(result.recordset.map(mapRowToSubmission));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`SELECT * FROM ${schema}.form_submissions WITH (NOLOCK) WHERE id = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Submissão não encontrada' });
    }

    res.json(mapRowToSubmission(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {};
    const id = body.id || uuid();

    if (!body.formId && !body.form_id) {
      return res.status(400).json({ message: 'formId é obrigatório' });
    }

    const pool = await getPool();
    const request = pool.request();

    request.input('id', sql.UniqueIdentifier, id);
    request.input('external_id', sql.NVarChar(50), body.external_id || body.externalId || null);
    request.input('form_id', sql.UniqueIdentifier, body.formId || body.form_id);
    request.input('data_json', sql.NVarChar(sql.MAX), stringifyJson(body.data || body.data_json || {}));
    request.input('submitter_name', sql.NVarChar(200), body.submitterName || body.submitter_name || null);
    request.input('submitter_email', sql.NVarChar(320), body.submitterEmail || body.submitter_email || null);

    const insertQuery = `
      INSERT INTO ${schema}.form_submissions (
        id, external_id, form_id, data_json, submitter_name, submitter_email
      )
      OUTPUT INSERTED.*
      VALUES (
        @id, @external_id, @form_id, @data_json, @submitter_name, @submitter_email
      )`;

    const result = await request.query(insertQuery);
    res.status(201).json(mapRowToSubmission(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`DELETE FROM ${schema}.form_submissions WHERE id = @id`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Submissão não encontrada' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
