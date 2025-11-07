import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import config from '../config.js';
import { getPool, sql } from '../db.js';
import { parseJson, stringifyJson } from '../utils/json.js';

const router = Router();
const schema = config.schema;

const mapRowToTermo = (row) => ({
  id: row.id,
  projetoId: row.projeto_id,
  projeto_id: row.projeto_id,
  unidadeEducacionalId: row.unidade_educacional_id,
  unidade_educacional_id: row.unidade_educacional_id,
  gestorNome: row.gestor_nome,
  gestorCpf: row.gestor_cpf,
  gestorRg: row.gestor_rg,
  portaria: row.portaria,
  professores: row.professores,
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
      .query(`SELECT * FROM ${schema}.termos_compromisso WITH (NOLOCK) ORDER BY created_at DESC`);

    res.json(result.recordset.map(mapRowToTermo));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`SELECT * FROM ${schema}.termos_compromisso WITH (NOLOCK) WHERE id = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Termo não encontrado' });
    }

    res.json(mapRowToTermo(result.recordset[0]));
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
    request.input('unidade_educacional_id', sql.NVarChar(20), body.unidadeEducacionalId || body.unidade_educacional_id || null);
    request.input('gestor_nome', sql.NVarChar(200), body.gestorNome || body.gestor_nome || null);
    request.input('gestor_cpf', sql.NVarChar(14), body.gestorCpf || body.gestor_cpf || null);
    request.input('gestor_rg', sql.NVarChar(20), body.gestorRg || body.gestor_rg || null);
    request.input('portaria', sql.NVarChar(50), body.portaria || null);
    request.input('professores', sql.NVarChar(sql.MAX), body.professores || null);
    request.input('conteudo', sql.NVarChar(sql.MAX), body.conteudo || '');
    request.input('validado', sql.Bit, body.validado ? 1 : 0);
    request.input('data_validacao', sql.DateTime2(0), body.dataValidacao || body.data_validacao || null);
    request.input('data_json', sql.NVarChar(sql.MAX), stringifyJson(body));

    const insertQuery = `
      INSERT INTO ${schema}.termos_compromisso (
        id, projeto_id, unidade_educacional_id, gestor_nome, gestor_cpf, gestor_rg,
        portaria, professores, conteudo, validado, data_validacao, data_json
      )
      OUTPUT INSERTED.*
      VALUES (
        @id, @projeto_id, @unidade_educacional_id, @gestor_nome, @gestor_cpf, @gestor_rg,
        @portaria, @professores, @conteudo, @validado, @data_validacao, @data_json
      )`;

    const result = await request.query(insertQuery);
    res.status(201).json(mapRowToTermo(result.recordset[0]));
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
    if (body.unidadeEducacionalId !== undefined || body.unidade_educacional_id !== undefined) {
      request.input('unidade_educacional_id', sql.NVarChar(20), body.unidadeEducacionalId || body.unidade_educacional_id);
    }
    if (body.gestorNome !== undefined || body.gestor_nome !== undefined) {
      request.input('gestor_nome', sql.NVarChar(200), body.gestorNome || body.gestor_nome);
    }
    if (body.gestorCpf !== undefined || body.gestor_cpf !== undefined) {
      request.input('gestor_cpf', sql.NVarChar(14), body.gestorCpf || body.gestor_cpf);
    }
    if (body.gestorRg !== undefined || body.gestor_rg !== undefined) {
      request.input('gestor_rg', sql.NVarChar(20), body.gestorRg || body.gestor_rg);
    }
    if (body.portaria !== undefined) request.input('portaria', sql.NVarChar(50), body.portaria);
    if (body.professores !== undefined) request.input('professores', sql.NVarChar(sql.MAX), body.professores);
    if (body.conteudo !== undefined) request.input('conteudo', sql.NVarChar(sql.MAX), body.conteudo);
    if (body.validado !== undefined) request.input('validado', sql.Bit, body.validado ? 1 : 0);
    if (body.dataValidacao !== undefined || body.data_validacao !== undefined) {
      request.input('data_validacao', sql.DateTime2(0), body.dataValidacao || body.data_validacao || null);
    }
    request.input('data_json', sql.NVarChar(sql.MAX), stringifyJson(body));

    const sets = [];
    if (body.projetoId !== undefined || body.projeto_id !== undefined) sets.push('projeto_id = @projeto_id');
    if (body.unidadeEducacionalId !== undefined || body.unidade_educacional_id !== undefined) sets.push('unidade_educacional_id = @unidade_educacional_id');
    if (body.gestorNome !== undefined || body.gestor_nome !== undefined) sets.push('gestor_nome = @gestor_nome');
    if (body.gestorCpf !== undefined || body.gestor_cpf !== undefined) sets.push('gestor_cpf = @gestor_cpf');
    if (body.gestorRg !== undefined || body.gestor_rg !== undefined) sets.push('gestor_rg = @gestor_rg');
    if (body.portaria !== undefined) sets.push('portaria = @portaria');
    if (body.professores !== undefined) sets.push('professores = @professores');
    if (body.conteudo !== undefined) sets.push('conteudo = @conteudo');
    if (body.validado !== undefined) sets.push('validado = @validado');
    if (body.dataValidacao !== undefined || body.data_validacao !== undefined) sets.push('data_validacao = @data_validacao');
    sets.push('data_json = @data_json');
    sets.push('updated_at = SYSDATETIME()');

    if (sets.length === 0) {
      return res.status(400).json({ message: 'Nenhum dado para atualizar' });
    }

    const updateQuery = `
      UPDATE ${schema}.termos_compromisso
      SET ${sets.join(', ')}
      WHERE id = @id;
      SELECT * FROM ${schema}.termos_compromisso WITH (NOLOCK) WHERE id = @id`;

    const result = await request.query(updateQuery);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Termo não encontrado' });
    }

    res.json(mapRowToTermo(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`DELETE FROM ${schema}.termos_compromisso WHERE id = @id`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Termo não encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
