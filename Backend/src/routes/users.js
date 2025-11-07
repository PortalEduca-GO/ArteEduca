import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import config from '../config.js';
import { getPool, sql } from '../db.js';
import { parseJson, stringifyJson } from '../utils/json.js';

const router = Router();
const schema = config.schema;

const mapRowToUser = (row) => {
  if (!row) {
    return null;
  }

  const availableRoles = parseJson(row.available_roles, []);

  return {
    id: row.id,
    external_id: row.external_id,
    full_name: row.full_name,
    name: row.full_name,
    email: row.email,
    password: row.password_hash,
    cpf: row.cpf,
    rg: row.rg,
    dataNascimento: row.data_nascimento ? row.data_nascimento.toISOString().split('T')[0] : null,
    data_nascimento: row.data_nascimento,
    telefone: row.telefone,
    app_role: row.app_role,
    role: row.app_role,
    available_roles: availableRoles,
    is_admin_account: Boolean(row.is_admin_account),
    isAdminAccount: Boolean(row.is_admin_account),
    is_active: Boolean(row.is_active),
    isActive: Boolean(row.is_active),
    cre: row.cre,
    municipio: row.municipio,
    unidadeEducacional: row.unidade_educacional,
    unidade_educacional: row.unidade_educacional,
    inep: row.inep,
    creSecundaria: row.cre_secundaria,
    municipioSecundaria: row.municipio_secundaria,
    unidadeEducacionalSecundaria: row.unidade_educacional_secundaria,
    inepSecundaria: row.inep_secundaria,
    creTerciaria: row.cre_terciaria,
    municipioTerciaria: row.municipio_terciaria,
    unidadeEducacionalTerciaria: row.unidade_educacional_terciaria,
    inepTerciaria: row.inep_terciaria,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_date: row.created_at,
    updated_date: row.updated_at,
    row_version: row.row_version,
    data_json: parseJson(row.data_json, null)
  };
};

const buildUserPayload = (payload = {}) => {
  const availableRoles = payload.available_roles || payload.availableRoles;

  return {
    id: payload.id || uuid(),
    external_id: payload.external_id || payload.externalId || null,
    full_name: payload.full_name || payload.fullName || payload.name || '',
    email: payload.email,
    password: payload.password,
    cpf: payload.cpf,
    rg: payload.rg || null,
    data_nascimento: payload.data_nascimento || payload.dataNascimento || null,
    telefone: payload.telefone || null,
    app_role: payload.app_role || payload.role || 'professor',
    available_roles: Array.isArray(availableRoles) ? availableRoles : null,
    cre: payload.cre || null,
    municipio: payload.municipio || null,
    unidade_educacional: payload.unidade_educacional || payload.unidadeEducacional || null,
    inep: payload.inep || null,
    cre_secundaria: payload.cre_secundaria || payload.creSecundaria || null,
    municipio_secundaria: payload.municipio_secundaria || payload.municipioSecundaria || null,
    unidade_educacional_secundaria: payload.unidade_educacional_secundaria || payload.unidadeEducacionalSecundaria || null,
    inep_secundaria: payload.inep_secundaria || payload.inepSecundaria || null,
    cre_terciaria: payload.cre_terciaria || payload.creTerciaria || null,
    municipio_terciaria: payload.municipio_terciaria || payload.municipioTerciaria || null,
    unidade_educacional_terciaria: payload.unidade_educacional_terciaria || payload.unidadeEducacionalTerciaria || null,
    inep_terciaria: payload.inep_terciaria || payload.inepTerciaria || null,
    is_admin_account: payload.is_admin_account ?? payload.isAdminAccount ?? false,
    is_active: payload.is_active ?? payload.isActive ?? true,
    data_json: payload
  };
};

router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`SELECT * FROM ${schema}.users WITH (NOLOCK) ORDER BY created_at DESC`);

    res.json(result.recordset.map(mapRowToUser));
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    const headerUserId = req.header('x-user-id');
    const queryUserId = req.query.id;
    const queryEmail = req.query.email;

    let query = `SELECT TOP 1 * FROM ${schema}.users WITH (NOLOCK)`;

    if (headerUserId || queryUserId) {
      request.input('userId', sql.UniqueIdentifier, headerUserId || queryUserId);
      query += ' WHERE id = @userId';
    } else if (queryEmail) {
      request.input('email', sql.NVarChar(320), queryEmail);
      query += ' WHERE email = @email';
    } else {
      query += ' WHERE is_admin_account = 1 ORDER BY created_at ASC';
    }

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(mapRowToUser(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`SELECT * FROM ${schema}.users WITH (NOLOCK) WHERE id = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(mapRowToUser(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = buildUserPayload(req.body);

    if (!payload.email) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }
    if (!payload.password) {
      return res.status(400).json({ message: 'Senha é obrigatória' });
    }
    if (!payload.cpf) {
      return res.status(400).json({ message: 'CPF é obrigatório' });
    }

    const passwordHash = payload.password.startsWith('$2')
      ? payload.password
      : await bcrypt.hash(payload.password, 10);

    const pool = await getPool();
    const request = pool.request();

    request.input('id', sql.UniqueIdentifier, payload.id);
    request.input('external_id', sql.NVarChar(50), payload.external_id);
    request.input('full_name', sql.NVarChar(200), payload.full_name);
    request.input('email', sql.NVarChar(320), payload.email);
    request.input('password_hash', sql.NVarChar(255), passwordHash);
    request.input('cpf', sql.NVarChar(14), payload.cpf);
    request.input('rg', sql.NVarChar(20), payload.rg);
    request.input('data_nascimento', sql.Date, payload.data_nascimento || null);
    request.input('telefone', sql.NVarChar(20), payload.telefone);
    request.input('app_role', sql.NVarChar(20), payload.app_role);
    request.input('available_roles', sql.NVarChar(200), stringifyJson(payload.available_roles));
    request.input('cre', sql.NVarChar(50), payload.cre);
    request.input('municipio', sql.NVarChar(120), payload.municipio);
    request.input('unidade_educacional', sql.NVarChar(200), payload.unidade_educacional);
    request.input('inep', sql.NVarChar(20), payload.inep);
    request.input('cre_secundaria', sql.NVarChar(50), payload.cre_secundaria);
    request.input('municipio_secundaria', sql.NVarChar(120), payload.municipio_secundaria);
    request.input('unidade_educacional_secundaria', sql.NVarChar(200), payload.unidade_educacional_secundaria);
    request.input('inep_secundaria', sql.NVarChar(20), payload.inep_secundaria);
    request.input('cre_terciaria', sql.NVarChar(50), payload.cre_terciaria);
    request.input('municipio_terciaria', sql.NVarChar(120), payload.municipio_terciaria);
    request.input('unidade_educacional_terciaria', sql.NVarChar(200), payload.unidade_educacional_terciaria);
    request.input('inep_terciaria', sql.NVarChar(20), payload.inep_terciaria);
    request.input('is_admin_account', sql.Bit, payload.is_admin_account ? 1 : 0);
    request.input('is_active', sql.Bit, payload.is_active ? 1 : 0);
    request.input('data_json', sql.NVarChar(sql.MAX), stringifyJson(payload.data_json));

    const insertQuery = `
      INSERT INTO ${schema}.users (
        id, external_id, full_name, email, password_hash, cpf, rg, data_nascimento,
        telefone, app_role, available_roles, cre, municipio, unidade_educacional, inep,
        cre_secundaria, municipio_secundaria, unidade_educacional_secundaria, inep_secundaria,
        cre_terciaria, municipio_terciaria, unidade_educacional_terciaria, inep_terciaria,
        is_admin_account, is_active, data_json
      )
      OUTPUT INSERTED.*
      VALUES (
        @id, @external_id, @full_name, @email, @password_hash, @cpf, @rg, @data_nascimento,
        @telefone, @app_role, @available_roles, @cre, @municipio, @unidade_educacional, @inep,
        @cre_secundaria, @municipio_secundaria, @unidade_educacional_secundaria, @inep_secundaria,
        @cre_terciaria, @municipio_terciaria, @unidade_educacional_terciaria, @inep_terciaria,
        @is_admin_account, @is_active, @data_json
      )`;

    const result = await request.query(insertQuery);
    res.status(201).json(mapRowToUser(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const payload = buildUserPayload({ ...req.body, id: req.params.id });

    const pool = await getPool();
    const request = pool.request();

    request.input('id', sql.UniqueIdentifier, payload.id);
    if (payload.external_id !== undefined) request.input('external_id', sql.NVarChar(50), payload.external_id);
    if (payload.full_name !== undefined) request.input('full_name', sql.NVarChar(200), payload.full_name);
    if (payload.email !== undefined) request.input('email', sql.NVarChar(320), payload.email);
    if (payload.cpf !== undefined) request.input('cpf', sql.NVarChar(14), payload.cpf);
    if (payload.rg !== undefined) request.input('rg', sql.NVarChar(20), payload.rg);
    if (payload.data_nascimento !== undefined) request.input('data_nascimento', sql.Date, payload.data_nascimento || null);
    if (payload.telefone !== undefined) request.input('telefone', sql.NVarChar(20), payload.telefone);
    if (payload.app_role !== undefined) request.input('app_role', sql.NVarChar(20), payload.app_role);
    if (payload.available_roles !== undefined) request.input('available_roles', sql.NVarChar(200), stringifyJson(payload.available_roles));
    if (payload.cre !== undefined) request.input('cre', sql.NVarChar(50), payload.cre);
    if (payload.municipio !== undefined) request.input('municipio', sql.NVarChar(120), payload.municipio);
    if (payload.unidade_educacional !== undefined) request.input('unidade_educacional', sql.NVarChar(200), payload.unidade_educacional);
    if (payload.inep !== undefined) request.input('inep', sql.NVarChar(20), payload.inep);
    if (payload.cre_secundaria !== undefined) request.input('cre_secundaria', sql.NVarChar(50), payload.cre_secundaria);
    if (payload.municipio_secundaria !== undefined) request.input('municipio_secundaria', sql.NVarChar(120), payload.municipio_secundaria);
    if (payload.unidade_educacional_secundaria !== undefined) request.input('unidade_educacional_secundaria', sql.NVarChar(200), payload.unidade_educacional_secundaria);
    if (payload.inep_secundaria !== undefined) request.input('inep_secundaria', sql.NVarChar(20), payload.inep_secundaria);
    if (payload.cre_terciaria !== undefined) request.input('cre_terciaria', sql.NVarChar(50), payload.cre_terciaria);
    if (payload.municipio_terciaria !== undefined) request.input('municipio_terciaria', sql.NVarChar(120), payload.municipio_terciaria);
    if (payload.unidade_educacional_terciaria !== undefined) request.input('unidade_educacional_terciaria', sql.NVarChar(200), payload.unidade_educacional_terciaria);
    if (payload.inep_terciaria !== undefined) request.input('inep_terciaria', sql.NVarChar(20), payload.inep_terciaria);
    if (payload.is_admin_account !== undefined) request.input('is_admin_account', sql.Bit, payload.is_admin_account ? 1 : 0);
    if (payload.is_active !== undefined) request.input('is_active', sql.Bit, payload.is_active ? 1 : 0);
    request.input('data_json', sql.NVarChar(sql.MAX), stringifyJson(payload.data_json));

    if (payload.password) {
      const passwordHash = payload.password.startsWith('$2')
        ? payload.password
        : await bcrypt.hash(payload.password, 10);
      request.input('password_hash', sql.NVarChar(255), passwordHash);
    }

    const setStatements = [];
    if (payload.external_id !== undefined) setStatements.push('external_id = @external_id');
    if (payload.full_name !== undefined) setStatements.push('full_name = @full_name');
    if (payload.email !== undefined) setStatements.push('email = @email');
    if (payload.password) setStatements.push('password_hash = @password_hash');
    if (payload.cpf !== undefined) setStatements.push('cpf = @cpf');
    if (payload.rg !== undefined) setStatements.push('rg = @rg');
    if (payload.data_nascimento !== undefined) setStatements.push('data_nascimento = @data_nascimento');
    if (payload.telefone !== undefined) setStatements.push('telefone = @telefone');
    if (payload.app_role !== undefined) setStatements.push('app_role = @app_role');
    if (payload.available_roles !== undefined) setStatements.push('available_roles = @available_roles');
    if (payload.cre !== undefined) setStatements.push('cre = @cre');
    if (payload.municipio !== undefined) setStatements.push('municipio = @municipio');
    if (payload.unidade_educacional !== undefined) setStatements.push('unidade_educacional = @unidade_educacional');
    if (payload.inep !== undefined) setStatements.push('inep = @inep');
    if (payload.cre_secundaria !== undefined) setStatements.push('cre_secundaria = @cre_secundaria');
    if (payload.municipio_secundaria !== undefined) setStatements.push('municipio_secundaria = @municipio_secundaria');
    if (payload.unidade_educacional_secundaria !== undefined) setStatements.push('unidade_educacional_secundaria = @unidade_educacional_secundaria');
    if (payload.inep_secundaria !== undefined) setStatements.push('inep_secundaria = @inep_secundaria');
    if (payload.cre_terciaria !== undefined) setStatements.push('cre_terciaria = @cre_terciaria');
    if (payload.municipio_terciaria !== undefined) setStatements.push('municipio_terciaria = @municipio_terciaria');
    if (payload.unidade_educacional_terciaria !== undefined) setStatements.push('unidade_educacional_terciaria = @unidade_educacional_terciaria');
    if (payload.inep_terciaria !== undefined) setStatements.push('inep_terciaria = @inep_terciaria');
    if (payload.is_admin_account !== undefined) setStatements.push('is_admin_account = @is_admin_account');
    if (payload.is_active !== undefined) setStatements.push('is_active = @is_active');
    setStatements.push('data_json = @data_json');
    setStatements.push('updated_at = SYSDATETIME()');

    if (setStatements.length === 0) {
      return res.status(400).json({ message: 'Nenhum dado fornecido para atualização' });
    }

    const updateQuery = `
      UPDATE ${schema}.users
      SET ${setStatements.join(', ')}
      WHERE id = @id;
      SELECT * FROM ${schema}.users WITH (NOLOCK) WHERE id = @id`;

    const result = await request.query(updateQuery);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(mapRowToUser(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`DELETE FROM ${schema}.users WHERE id = @id`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
