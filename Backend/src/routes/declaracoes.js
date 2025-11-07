import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import config from '../config.js';
import { getPool, sql } from '../db.js';
import { parseJson, stringifyJson } from '../utils/json.js';

const router = Router();
const schema = config.schema;

const mapRowToDeclaracao = (row) => ({
  id: row.id,
  projetoId: row.projeto_id,
  projeto_id: row.projeto_id,
  conteudo: row.conteudo,
  validado: Boolean(row.validado),
  dataValidacao: row.data_validacao,
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
      .query(`SELECT * FROM ${schema}.declaracoes_cre WITH (NOLOCK) ORDER BY created_at DESC`);

    res.json(result.recordset.map(mapRowToDeclaracao));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`SELECT * FROM ${schema}.declaracoes_cre WITH (NOLOCK) WHERE id = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Declaração não encontrada' });
    }

    res.json(mapRowToDeclaracao(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {};
    const id = body.id || uuid();

    if (!body.projetoId && !body.projeto_id) {
      return res.status(400).json({ message: 'projetoId é obrigatório' });
    }

    const pool = await getPool();
    const request = pool.request();

    request.input('id', sql.UniqueIdentifier, id);
    request.input('projeto_id', sql.UniqueIdentifier, body.projetoId || body.projeto_id);
    request.input('conteudo', sql.NVarChar(sql.MAX), body.conteudo || '');
    request.input('validado', sql.Bit, body.validado ? 1 : 0);
    request.input('data_validacao', sql.DateTime2(0), body.dataValidacao || body.data_validacao || null);
    request.input('data_json', sql.NVarChar(sql.MAX), stringifyJson(body));

    const insertQuery = `
      INSERT INTO ${schema}.declaracoes_cre (
        id, projeto_id, conteudo, validado, data_validacao, data_json
      )
      OUTPUT INSERTED.*
      VALUES (
        @id, @projeto_id, @conteudo, @validado, @data_validacao, @data_json
      )`;

    const result = await request.query(insertQuery);
    res.status(201).json(mapRowToDeclaracao(result.recordset[0]));
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
    if (body.projetoId !== undefined || body.projeto_id !== undefined) {
      request.input('projeto_id', sql.UniqueIdentifier, body.projetoId || body.projeto_id);
    }
    if (body.conteudo !== undefined) request.input('conteudo', sql.NVarChar(sql.MAX), body.conteudo);
    if (body.validado !== undefined) request.input('validado', sql.Bit, body.validado ? 1 : 0);
    if (body.dataValidacao !== undefined || body.data_validacao !== undefined) {
      request.input('data_validacao', sql.DateTime2(0), body.dataValidacao || body.data_validacao || null);
    }
    request.input('data_json', sql.NVarChar(sql.MAX), stringifyJson(body));

    const sets = [];
    if (body.projetoId !== undefined || body.projeto_id !== undefined) sets.push('projeto_id = @projeto_id');
    if (body.conteudo !== undefined) sets.push('conteudo = @conteudo');
    if (body.validado !== undefined) sets.push('validado = @validado');
    if (body.dataValidacao !== undefined || body.data_validacao !== undefined) sets.push('data_validacao = @data_validacao');
    sets.push('data_json = @data_json');
    sets.push('updated_at = SYSDATETIME()');

    if (sets.length === 0) {
      return res.status(400).json({ message: 'Nenhum dado para atualizar' });
    }

    const updateQuery = `
      UPDATE ${schema}.declaracoes_cre
      SET ${sets.join(', ')}
      WHERE id = @id;
      SELECT * FROM ${schema}.declaracoes_cre WITH (NOLOCK) WHERE id = @id`;

    const result = await request.query(updateQuery);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Declaração não encontrada' });
    }

    res.json(mapRowToDeclaracao(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`DELETE FROM ${schema}.declaracoes_cre WHERE id = @id`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Declaração não encontrada' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
