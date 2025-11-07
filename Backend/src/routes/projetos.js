import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import config from '../config.js';
import { getPool, sql } from '../db.js';
import { parseJson, stringifyJson } from '../utils/json.js';

const router = Router();
const schema = config.schema;

const normalizeProjectRow = (row) => {
  const data = parseJson(row.data_json, {});
  const identificacao = data.identificacao || {};
  const professor = identificacao.professor || {};
  const projeto = data.projeto || {};
  const quadroHorario = data.quadroHorario || data.quadro_horario || {};
  const planoAnual = data.planoAnual || data.plano_anual || {};
  const cronograma = data.cronograma || {};

  return {
    ...data,
    id: row.id,
    external_id: row.external_id,
    tipoProjeto: data.tipoProjeto || data.tipo_projeto || row.tipo_projeto,
    status: row.status,
    status_gestor: row.status_gestor,
    status_cre: row.status_cre,
    justificativaRejeicao: data.justificativaRejeicao || row.justificativa_rejeicao || '',
    numeroProcessoSEI: data.numeroProcessoSEI || row.numero_processo_sei || '',
    dataSubmissao: data.dataSubmissao || row.data_submissao,
    dataAprovacao: data.dataAprovacao || row.data_aprovacao,
    created_by_user_id: row.created_by_user_id,
    created_by_email: row.created_by_email,
    cre: row.cre,
    municipio: row.municipio,
    unidadeEducacional: row.unidade_educacional,
    tipoMatriz: identificacao.tipoMatriz || row.tipo_matriz,
    inep: row.inep,
    quantidadeEstudantes: identificacao.quantidadeEstudantes ?? row.quantidade_estudantes,
    quantidadeAlunosFundamental2: identificacao.quantidadeAlunosFundamental2 ?? row.quantidade_alunos_fundamental2,
    quantidadeAlunosMedio: identificacao.quantidadeAlunosMedio ?? row.quantidade_alunos_medio,
    identificacao: {
      ...identificacao,
      cre: identificacao.cre ?? row.cre,
      municipio: identificacao.municipio ?? row.municipio,
      unidadeEducacional: identificacao.unidadeEducacional ?? row.unidade_educacional,
      tipoMatriz: identificacao.tipoMatriz ?? row.tipo_matriz,
      inep: identificacao.inep ?? row.inep,
      quantidadeEstudantes: identificacao.quantidadeEstudantes ?? row.quantidade_estudantes,
      quantidadeAlunosFundamental2: identificacao.quantidadeAlunosFundamental2 ?? row.quantidade_alunos_fundamental2,
      quantidadeAlunosMedio: identificacao.quantidadeAlunosMedio ?? row.quantidade_alunos_medio,
      professor: {
        ...professor,
        nome: professor.nome ?? row.professor_nome,
        cpf: professor.cpf ?? row.professor_cpf,
        rg: professor.rg ?? row.professor_rg,
        dataNascimento: professor.dataNascimento ?? row.professor_data_nascimento,
        telefone: professor.telefone ?? row.professor_telefone,
        email: professor.email ?? row.professor_email
      }
    },
    projeto: {
      ...projeto,
      introducao: projeto.introducao ?? row.introducao,
      justificativa: projeto.justificativa ?? row.justificativa,
      objetivoGeral: projeto.objetivoGeral ?? row.objetivo_geral,
      objetivosEspecificos: projeto.objetivosEspecificos ?? row.objetivos_especificos,
      metodologia: projeto.metodologia ?? row.metodologia,
      avaliacao: projeto.avaliacao ?? row.avaliacao,
      referencias: projeto.referencias ?? row.referencias
    },
    quadroHorario: {
      ...quadroHorario
    },
    planoAnual: {
      ...planoAnual
    },
    cronograma: {
      ...cronograma
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_date: row.created_at,
    updated_date: row.updated_at,
    row_version: row.row_version
  };
};

const mapProjectPayload = (payload = {}) => {
  const identificacao = payload.identificacao || {};
  const professor = identificacao.professor || {};
  const projeto = payload.projeto || {};

  const toInt = (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  return {
    id: payload.id || uuid(),
    external_id: payload.external_id || payload.externalId || null,
    tipo_projeto: payload.tipoProjeto || payload.tipo_projeto || null,
    status: payload.status || 'rascunho',
    status_gestor: payload.status_gestor || 'pendente',
    status_cre: payload.status_cre || 'pendente',
    justificativa_rejeicao: payload.justificativaRejeicao || payload.justificativa_rejeicao || null,
    numero_processo_sei: payload.numeroProcessoSEI || payload.numero_processo_sei || null,
    data_submissao: payload.dataSubmissao || payload.data_submissao || null,
    data_aprovacao: payload.dataAprovacao || payload.data_aprovacao || null,
    created_by_user_id: payload.created_by_user_id || payload.createdByUserId || null,
    created_by_email: payload.created_by_email || payload.createdByEmail || payload.created_by || null,
    cre: identificacao.cre || payload.cre || null,
    municipio: identificacao.municipio || payload.municipio || null,
    unidade_educacional: identificacao.unidadeEducacional || payload.unidadeEducacional || null,
    tipo_matriz: identificacao.tipoMatriz || payload.tipoMatriz || null,
    inep: identificacao.inep || payload.inep || null,
    quantidade_estudantes: toInt(identificacao.quantidadeEstudantes ?? payload.quantidadeEstudantes),
    quantidade_alunos_fundamental2: toInt(identificacao.quantidadeAlunosFundamental2 ?? payload.quantidadeAlunosFundamental2),
    quantidade_alunos_medio: toInt(identificacao.quantidadeAlunosMedio ?? payload.quantidadeAlunosMedio),
    professor_nome: professor.nome || payload.professor_nome || null,
    professor_cpf: professor.cpf || payload.professor_cpf || null,
    professor_rg: professor.rg || payload.professor_rg || null,
    professor_data_nascimento: professor.dataNascimento || payload.professor_data_nascimento || null,
    professor_telefone: professor.telefone || payload.professor_telefone || null,
    professor_email: professor.email || payload.professor_email || null,
    introducao: projeto.introducao || payload.introducao || null,
    justificativa: projeto.justificativa || payload.justificativa || null,
    objetivo_geral: projeto.objetivoGeral || payload.objetivo_geral || null,
    objetivos_especificos: projeto.objetivosEspecificos || payload.objetivos_especificos || null,
    metodologia: projeto.metodologia || payload.metodologia || null,
    avaliacao: projeto.avaliacao || payload.avaliacao || null,
    referencias: projeto.referencias || payload.referencias || null,
    data_json: payload
  };
};

router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    let query = `SELECT * FROM ${schema}.projetos WITH (NOLOCK)`;

    if (req.query.status) {
      request.input('status', sql.NVarChar(20), req.query.status);
      query += ' WHERE status = @status';
    }

    query += ' ORDER BY created_at DESC';

    const result = await request.query(query);
    res.json(result.recordset.map(normalizeProjectRow));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`SELECT * FROM ${schema}.projetos WITH (NOLOCK) WHERE id = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Projeto não encontrado' });
    }

    res.json(normalizeProjectRow(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = mapProjectPayload(req.body || {});
    const pool = await getPool();
    const request = pool.request();

    request.input('id', sql.UniqueIdentifier, payload.id);
    request.input('external_id', sql.NVarChar(50), payload.external_id);
    request.input('tipo_projeto', sql.NVarChar(50), payload.tipo_projeto);
    request.input('status', sql.NVarChar(20), payload.status);
    request.input('status_gestor', sql.NVarChar(20), payload.status_gestor);
    request.input('status_cre', sql.NVarChar(20), payload.status_cre);
    request.input('justificativa_rejeicao', sql.NVarChar(sql.MAX), payload.justificativa_rejeicao);
    request.input('numero_processo_sei', sql.NVarChar(20), payload.numero_processo_sei);
    request.input('data_submissao', sql.DateTime2(0), payload.data_submissao || null);
    request.input('data_aprovacao', sql.DateTime2(0), payload.data_aprovacao || null);
    request.input('created_by_user_id', sql.UniqueIdentifier, payload.created_by_user_id);
    request.input('created_by_email', sql.NVarChar(320), payload.created_by_email);
    request.input('cre', sql.NVarChar(50), payload.cre);
    request.input('municipio', sql.NVarChar(120), payload.municipio);
    request.input('unidade_educacional', sql.NVarChar(200), payload.unidade_educacional);
    request.input('tipo_matriz', sql.NVarChar(20), payload.tipo_matriz);
    request.input('inep', sql.NVarChar(20), payload.inep);
    request.input('quantidade_estudantes', sql.Int, payload.quantidade_estudantes);
    request.input('quantidade_alunos_fundamental2', sql.Int, payload.quantidade_alunos_fundamental2);
    request.input('quantidade_alunos_medio', sql.Int, payload.quantidade_alunos_medio);
    request.input('professor_nome', sql.NVarChar(200), payload.professor_nome);
    request.input('professor_cpf', sql.NVarChar(14), payload.professor_cpf);
    request.input('professor_rg', sql.NVarChar(20), payload.professor_rg);
    request.input('professor_data_nascimento', sql.Date, payload.professor_data_nascimento || null);
    request.input('professor_telefone', sql.NVarChar(20), payload.professor_telefone);
    request.input('professor_email', sql.NVarChar(320), payload.professor_email);
    request.input('introducao', sql.NVarChar(sql.MAX), payload.introducao);
    request.input('justificativa', sql.NVarChar(sql.MAX), payload.justificativa);
    request.input('objetivo_geral', sql.NVarChar(sql.MAX), payload.objetivo_geral);
    request.input('objetivos_especificos', sql.NVarChar(sql.MAX), payload.objetivos_especificos);
    request.input('metodologia', sql.NVarChar(sql.MAX), payload.metodologia);
    request.input('avaliacao', sql.NVarChar(sql.MAX), payload.avaliacao);
    request.input('referencias', sql.NVarChar(sql.MAX), payload.referencias);
    request.input('data_json', sql.NVarChar(sql.MAX), stringifyJson(payload.data_json));

    const insertQuery = `
      INSERT INTO ${schema}.projetos (
        id, external_id, tipo_projeto, status, status_gestor, status_cre,
        justificativa_rejeicao, numero_processo_sei, data_submissao, data_aprovacao,
        created_by_user_id, created_by_email, cre, municipio, unidade_educacional,
        tipo_matriz, inep, quantidade_estudantes, quantidade_alunos_fundamental2,
        quantidade_alunos_medio, professor_nome, professor_cpf, professor_rg,
        professor_data_nascimento, professor_telefone, professor_email,
        introducao, justificativa, objetivo_geral, objetivos_especificos,
        metodologia, avaliacao, referencias, data_json
      )
      OUTPUT INSERTED.*
      VALUES (
        @id, @external_id, @tipo_projeto, @status, @status_gestor, @status_cre,
        @justificativa_rejeicao, @numero_processo_sei, @data_submissao, @data_aprovacao,
        @created_by_user_id, @created_by_email, @cre, @municipio, @unidade_educacional,
        @tipo_matriz, @inep, @quantidade_estudantes, @quantidade_alunos_fundamental2,
        @quantidade_alunos_medio, @professor_nome, @professor_cpf, @professor_rg,
        @professor_data_nascimento, @professor_telefone, @professor_email,
        @introducao, @justificativa, @objetivo_geral, @objetivos_especificos,
        @metodologia, @avaliacao, @referencias, @data_json
      )`;

    const result = await request.query(insertQuery);
    res.status(201).json(normalizeProjectRow(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const payload = mapProjectPayload({ ...req.body, id: req.params.id });
    const pool = await getPool();
    const request = pool.request();

    request.input('id', sql.UniqueIdentifier, payload.id);

    const setStatements = [];

    const addOptional = (field, type, value) => {
      if (value !== undefined) {
        request.input(field, type, value);
        setStatements.push(`${field} = @${field}`);
      }
    };

    addOptional('external_id', sql.NVarChar(50), payload.external_id);
    addOptional('tipo_projeto', sql.NVarChar(50), payload.tipo_projeto);
    addOptional('status', sql.NVarChar(20), payload.status);
    addOptional('status_gestor', sql.NVarChar(20), payload.status_gestor);
    addOptional('status_cre', sql.NVarChar(20), payload.status_cre);
    addOptional('justificativa_rejeicao', sql.NVarChar(sql.MAX), payload.justificativa_rejeicao);
    addOptional('numero_processo_sei', sql.NVarChar(20), payload.numero_processo_sei);
    addOptional('data_submissao', sql.DateTime2(0), payload.data_submissao || null);
    addOptional('data_aprovacao', sql.DateTime2(0), payload.data_aprovacao || null);
    addOptional('created_by_user_id', sql.UniqueIdentifier, payload.created_by_user_id);
    addOptional('created_by_email', sql.NVarChar(320), payload.created_by_email);
    addOptional('cre', sql.NVarChar(50), payload.cre);
    addOptional('municipio', sql.NVarChar(120), payload.municipio);
    addOptional('unidade_educacional', sql.NVarChar(200), payload.unidade_educacional);
    addOptional('tipo_matriz', sql.NVarChar(20), payload.tipo_matriz);
    addOptional('inep', sql.NVarChar(20), payload.inep);
    addOptional('quantidade_estudantes', sql.Int, payload.quantidade_estudantes);
    addOptional('quantidade_alunos_fundamental2', sql.Int, payload.quantidade_alunos_fundamental2);
    addOptional('quantidade_alunos_medio', sql.Int, payload.quantidade_alunos_medio);
    addOptional('professor_nome', sql.NVarChar(200), payload.professor_nome);
    addOptional('professor_cpf', sql.NVarChar(14), payload.professor_cpf);
    addOptional('professor_rg', sql.NVarChar(20), payload.professor_rg);
    addOptional('professor_data_nascimento', sql.Date, payload.professor_data_nascimento || null);
    addOptional('professor_telefone', sql.NVarChar(20), payload.professor_telefone);
    addOptional('professor_email', sql.NVarChar(320), payload.professor_email);
    addOptional('introducao', sql.NVarChar(sql.MAX), payload.introducao);
    addOptional('justificativa', sql.NVarChar(sql.MAX), payload.justificativa);
    addOptional('objetivo_geral', sql.NVarChar(sql.MAX), payload.objetivo_geral);
    addOptional('objetivos_especificos', sql.NVarChar(sql.MAX), payload.objetivos_especificos);
    addOptional('metodologia', sql.NVarChar(sql.MAX), payload.metodologia);
    addOptional('avaliacao', sql.NVarChar(sql.MAX), payload.avaliacao);
    addOptional('referencias', sql.NVarChar(sql.MAX), payload.referencias);

    request.input('data_json', sql.NVarChar(sql.MAX), stringifyJson(payload.data_json));
    setStatements.push('data_json = @data_json');
    setStatements.push('updated_at = SYSDATETIME()');

    if (setStatements.length === 0) {
      return res.status(400).json({ message: 'Nenhum dado para atualizar' });
    }

    const updateQuery = `
      UPDATE ${schema}.projetos
      SET ${setStatements.join(', ')}
      WHERE id = @id;
      SELECT * FROM ${schema}.projetos WITH (NOLOCK) WHERE id = @id`;

    const result = await request.query(updateQuery);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Projeto não encontrado' });
    }

    res.json(normalizeProjectRow(result.recordset[0]));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`DELETE FROM ${schema}.projetos WHERE id = @id`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Projeto não encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
