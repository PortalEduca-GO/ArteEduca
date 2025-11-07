import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import config from '../config.js';
import { getPool, sql } from '../db.js';
import { stringifyJson, parseJson } from '../utils/json.js';

const router = Router();
const schema = config.schema;

const mapRowToEscola = (row) => ({
  id: row.id,
  inep: row.inep,
  nome: row.nome,
  unidadeEducacional: row.nome,
  cre: row.cre,
  municipio: row.municipio,
  endereco: row.endereco,
  telefone: row.telefone,
  email: row.email,
  created_at: row.created_at,
  updated_at: row.updated_at,
  created_date: row.created_at,
  updated_date: row.updated_at,
  data_json: parseJson(row.data_json, null)
});

const buildInsertRequest = (request, escola) => {
  request.input('id', sql.UniqueIdentifier, escola.id || uuid());
  request.input('inep', sql.NVarChar(20), escola.inep || null);
  request.input('nome', sql.NVarChar(200), escola.nome || escola.unidadeEducacional || null);
  request.input('cre', sql.NVarChar(50), escola.cre || null);
  request.input('municipio', sql.NVarChar(120), escola.municipio || null);
  request.input('endereco', sql.NVarChar(250), escola.endereco || null);
  request.input('telefone', sql.NVarChar(20), escola.telefone || null);
  request.input('email', sql.NVarChar(120), escola.email || null);
  request.input('data_json', sql.NVarChar(sql.MAX), stringifyJson(escola));
};

router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    let query = `SELECT * FROM ${schema}.escolas WITH (NOLOCK)`;
    const search = (req.query.search || '').trim();

    if (search) {
      request.input('search', sql.NVarChar(200), `%${search}%`);
      query += ` WHERE (
        nome LIKE @search OR
        municipio LIKE @search OR
        cre LIKE @search OR
        inep LIKE @search OR
        email LIKE @search
      )`;
    }

    query += ' ORDER BY nome ASC';

    const result = await request.query(query);
    res.json(result.recordset.map(mapRowToEscola));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`SELECT * FROM ${schema}.escolas WITH (NOLOCK) WHERE id = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Escola não encontrada' });
    }

    res.json(mapRowToEscola(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    const body = req.body || {};

    const id = body.id || uuid();

    request.input('id', sql.UniqueIdentifier, id);
    request.input('inep', sql.NVarChar(20), body.inep || null);
    request.input('nome', sql.NVarChar(200), body.nome || body.unidadeEducacional || null);
    request.input('cre', sql.NVarChar(50), body.cre || null);
    request.input('municipio', sql.NVarChar(120), body.municipio || null);
    request.input('endereco', sql.NVarChar(250), body.endereco || null);
    request.input('telefone', sql.NVarChar(20), body.telefone || null);
    request.input('email', sql.NVarChar(120), body.email || null);
    request.input('data_json', sql.NVarChar(sql.MAX), stringifyJson(body));

    const insertQuery = `
      INSERT INTO ${schema}.escolas (
        id, inep, nome, cre, municipio, endereco, telefone, email, data_json
      )
      OUTPUT INSERTED.*
      VALUES (
        @id, @inep, @nome, @cre, @municipio, @endereco, @telefone, @email, @data_json
      )`;

    const result = await request.query(insertQuery);
    res.status(201).json(mapRowToEscola(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.post('/bulk', async (req, res, next) => {
  const items = Array.isArray(req.body) ? req.body : req.body.items;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Nenhum registro fornecido para importação' });
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(await pool);

  try {
    await transaction.begin();

    for (const rawItem of items) {
      const item = {
        id: rawItem.id || uuid(),
        inep: rawItem.inep,
        nome: rawItem.nome || rawItem.unidadeEducacional,
        cre: rawItem.cre,
        municipio: rawItem.municipio,
        endereco: rawItem.endereco || null,
        telefone: rawItem.telefone || null,
        email: rawItem.email || null
      };

      const request = new sql.Request(transaction);
      buildInsertRequest(request, { ...rawItem, ...item });

      const query = `
        MERGE ${schema}.escolas AS target
        USING (SELECT @inep AS inep) AS source
        ON target.inep = source.inep
        WHEN MATCHED THEN
          UPDATE SET
            nome = @nome,
            cre = @cre,
            municipio = @municipio,
            endereco = @endereco,
            telefone = @telefone,
            email = @email,
            data_json = @data_json,
            updated_at = SYSDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (id, inep, nome, cre, municipio, endereco, telefone, email, data_json)
          VALUES (@id, @inep, @nome, @cre, @municipio, @endereco, @telefone, @email, @data_json);`;

      await request.query(query);
    }

    await transaction.commit();
    res.json({ success: true, count: items.length });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    const body = req.body || {};

    request.input('id', sql.UniqueIdentifier, req.params.id);
    if (body.inep !== undefined) request.input('inep', sql.NVarChar(20), body.inep);
    if (body.nome !== undefined || body.unidadeEducacional !== undefined) {
      request.input('nome', sql.NVarChar(200), body.nome || body.unidadeEducacional);
    }
    if (body.cre !== undefined) request.input('cre', sql.NVarChar(50), body.cre);
    if (body.municipio !== undefined) request.input('municipio', sql.NVarChar(120), body.municipio);
    if (body.endereco !== undefined) request.input('endereco', sql.NVarChar(250), body.endereco);
    if (body.telefone !== undefined) request.input('telefone', sql.NVarChar(20), body.telefone);
    if (body.email !== undefined) request.input('email', sql.NVarChar(120), body.email);
    request.input('data_json', sql.NVarChar(sql.MAX), stringifyJson(body));

    const sets = [];
    if (body.inep !== undefined) sets.push('inep = @inep');
    if (body.nome !== undefined || body.unidadeEducacional !== undefined) sets.push('nome = @nome');
    if (body.cre !== undefined) sets.push('cre = @cre');
    if (body.municipio !== undefined) sets.push('municipio = @municipio');
    if (body.endereco !== undefined) sets.push('endereco = @endereco');
    if (body.telefone !== undefined) sets.push('telefone = @telefone');
    if (body.email !== undefined) sets.push('email = @email');
    sets.push('data_json = @data_json');
    sets.push('updated_at = SYSDATETIME()');

    if (sets.length === 0) {
      return res.status(400).json({ message: 'Nenhum dado para atualizar' });
    }

    const updateQuery = `
      UPDATE ${schema}.escolas
      SET ${sets.join(', ')}
      WHERE id = @id;
      SELECT * FROM ${schema}.escolas WITH (NOLOCK) WHERE id = @id`;

    const result = await request.query(updateQuery);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Escola não encontrada' });
    }

    res.json(mapRowToEscola(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.post('/bulk-delete', async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body) ? req.body : req.body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Informe os IDs para exclusão' });
    }

    const pool = await getPool();
    const request = pool.request();

    ids.forEach((id, index) => {
      request.input(`id${index}`, sql.UniqueIdentifier, id);
    });

    const placeholders = ids.map((_, index) => `@id${index}`).join(', ');
    const query = `DELETE FROM ${schema}.escolas WHERE id IN (${placeholders})`;

    const result = await request.query(query);
    res.json({ deleted: result.rowsAffected[0] || 0, failed: ids.length - (result.rowsAffected[0] || 0) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`DELETE FROM ${schema}.escolas WHERE id = @id`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Escola não encontrada' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
