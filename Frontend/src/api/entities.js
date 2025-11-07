import RemoteEntity from './remoteEntity';
import httpClient from './httpClient';

const normalizeDate = (value) => {
  if (!value) {
    return value;
  }
  try {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
  } catch (error) {
    return value;
  }
};

const normalizeForm = (form = {}) => ({
  ...form,
  fields: Array.isArray(form.fields) ? form.fields : [],
  settings: form.settings || {},
  styling: form.styling || {},
  isActive: form.isActive ?? form.is_active ?? true,
  created_date: form.created_date || form.created_at || normalizeDate(form.created_at),
  updated_date: form.updated_date || form.updated_at || normalizeDate(form.updated_at)
});

const serializeForm = (form = {}) => {
  const {
    id,
    title,
    description,
    fields,
    settings,
    styling,
    isActive,
    is_active,
    created_by_user_id,
    createdByUserId,
    external_id,
    externalId
  } = form;

  return {
    id,
    title,
    description,
    fields,
    settings,
    styling,
    isActive: isActive ?? is_active,
    created_by_user_id: created_by_user_id ?? createdByUserId,
    external_id: external_id ?? externalId
  };
};

const normalizeSubmission = (submission = {}) => ({
  ...submission,
  data: submission.data || {},
  formId: submission.formId || submission.form_id,
  submitterName: submission.submitterName || submission.submitter_name,
  submitterEmail: submission.submitterEmail || submission.submitter_email,
  created_date: submission.created_date || submission.submitted_at || normalizeDate(submission.submitted_at),
  updated_date: submission.updated_date || submission.submitted_at || normalizeDate(submission.submitted_at)
});

const serializeSubmission = (submission = {}) => ({
  id: submission.id,
  formId: submission.formId || submission.form_id,
  data: submission.data,
  submitterName: submission.submitterName || submission.submitter_name,
  submitterEmail: submission.submitterEmail || submission.submitter_email
});

const normalizeEscola = (escola = {}) => ({
  ...escola,
  unidadeEducacional: escola.unidadeEducacional || escola.nome,
  nome: escola.nome || escola.unidadeEducacional,
  created_date: escola.created_date || escola.created_at || normalizeDate(escola.created_at),
  updated_date: escola.updated_date || escola.updated_at || normalizeDate(escola.updated_at)
});

const serializeEscola = (escola = {}) => ({
  id: escola.id,
  inep: escola.inep,
  nome: escola.nome || escola.unidadeEducacional,
  unidadeEducacional: escola.unidadeEducacional || escola.nome,
  cre: escola.cre,
  municipio: escola.municipio,
  endereco: escola.endereco,
  telefone: escola.telefone,
  email: escola.email
});

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const defaultProjeto = () => ({
  identificacao: {
    professor: {},
    etapasEnsino: [],
    funcao: {},
    recursosMateriais: []
  },
  projeto: {},
  quadroHorario: {},
  planoAnual: {},
  cronograma: {}
});

const normalizeProjeto = (projeto = {}) => {
  const merged = { ...defaultProjeto(), ...projeto };
  merged.identificacao = {
    ...defaultProjeto().identificacao,
    ...merged.identificacao,
    etapasEnsino: ensureArray(merged.identificacao?.etapasEnsino),
    recursosMateriais: ensureArray(merged.identificacao?.recursosMateriais),
    professor: {
      ...defaultProjeto().identificacao.professor,
      ...merged.identificacao?.professor
    }
  };

  merged.quadroHorario = { ...defaultProjeto().quadroHorario, ...merged.quadroHorario };
  merged.planoAnual = { ...defaultProjeto().planoAnual, ...merged.planoAnual };
  merged.cronograma = { ...defaultProjeto().cronograma, ...merged.cronograma };

  merged.created_date = merged.created_date || merged.created_at || normalizeDate(merged.created_at);
  merged.updated_date = merged.updated_date || merged.updated_at || normalizeDate(merged.updated_at);

  return merged;
};

const serializeProjeto = (projeto = {}) => projeto;

const normalizeTermo = (termo = {}) => ({
  ...termo,
  projetoId: termo.projetoId || termo.projeto_id,
  unidadeEducacionalId: termo.unidadeEducacionalId || termo.unidade_educacional_id,
  gestorNome: termo.gestorNome || termo.gestor_nome,
  gestorCpf: termo.gestorCpf || termo.gestor_cpf,
  gestorRg: termo.gestorRg || termo.gestor_rg,
  dataValidacao: termo.dataValidacao || termo.data_validacao,
  created_date: termo.created_date || termo.created_at || normalizeDate(termo.created_at),
  updated_date: termo.updated_date || termo.updated_at || normalizeDate(termo.updated_at)
});

const serializeTermo = (termo = {}) => ({
  id: termo.id,
  projetoId: termo.projetoId || termo.projeto_id,
  unidadeEducacionalId: termo.unidadeEducacionalId || termo.unidade_educacional_id,
  gestorNome: termo.gestorNome || termo.gestor_nome,
  gestorCpf: termo.gestorCpf || termo.gestor_cpf,
  gestorRg: termo.gestorRg || termo.gestor_rg,
  portaria: termo.portaria,
  professores: termo.professores,
  conteudo: termo.conteudo,
  validado: termo.validado,
  dataValidacao: termo.dataValidacao || termo.data_validacao
});

const normalizeDeclaracao = (declaracao = {}) => ({
  ...declaracao,
  projetoId: declaracao.projetoId || declaracao.projeto_id,
  dataValidacao: declaracao.dataValidacao || declaracao.data_validacao,
  created_date: declaracao.created_date || declaracao.created_at || normalizeDate(declaracao.created_at),
  updated_date: declaracao.updated_date || declaracao.updated_at || normalizeDate(declaracao.updated_at)
});

const serializeDeclaracao = (declaracao = {}) => ({
  id: declaracao.id,
  projetoId: declaracao.projetoId || declaracao.projeto_id,
  conteudo: declaracao.conteudo,
  validado: declaracao.validado,
  dataValidacao: declaracao.dataValidacao || declaracao.data_validacao
});

const normalizeUser = (user = {}, existing = {}) => {
  const combined = { ...existing, ...user };
  const appRole = combined.app_role || combined.appRole || combined.role || 'professor';
  const fullName = combined.full_name || combined.fullName || combined.name || '';
  const rawAvailableRoles = combined.available_roles || combined.availableRoles;
  const persistedAdminFlag = combined.is_admin_account ?? combined.isAdminAccount;
  const hadAdminRole = Array.isArray(rawAvailableRoles) && rawAvailableRoles.includes('admin');
  const isAdminAccount = persistedAdminFlag !== undefined
    ? Boolean(persistedAdminFlag)
    : (appRole === 'admin' || combined.id === 'user-admin-001' || combined.email === 'admin@adm' || hadAdminRole);

  let availableRoles = rawAvailableRoles;
  if (!Array.isArray(availableRoles) || availableRoles.length === 0) {
    availableRoles = isAdminAccount
      ? ['admin', 'gestor', 'articulador', 'professor']
      : [appRole];
  }

  if (isAdminAccount) {
    availableRoles = ['admin', 'gestor', 'articulador', 'professor'];
  } else {
    const allowedNonAdminRoles = ['gestor', 'articulador', 'professor'];
    availableRoles = Array.from(new Set(
      availableRoles.filter((role) => allowedNonAdminRoles.includes(role))
    ));

    if (appRole && !availableRoles.includes(appRole)) {
      availableRoles.push(appRole);
    }
  }

  return {
    ...combined,
    app_role: appRole,
    role: appRole,
    full_name: fullName,
    name: combined.name || fullName,
    available_roles: availableRoles,
    is_admin_account: isAdminAccount,
    isAdminAccount,
    is_active: combined.is_active ?? combined.isActive ?? true,
    isActive: combined.is_active ?? combined.isActive ?? true,
    password: combined.password || combined.password_hash,
    created_date: combined.created_date || combined.created_at || normalizeDate(combined.created_at),
    updated_date: combined.updated_date || combined.updated_at || normalizeDate(combined.updated_at)
  };
};

const serializeUser = (user = {}) => ({
  id: user.id,
  external_id: user.external_id || user.externalId,
  full_name: user.full_name || user.fullName || user.name,
  email: user.email,
  password: user.password,
  cpf: user.cpf,
  rg: user.rg,
  dataNascimento: user.dataNascimento || user.data_nascimento,
  telefone: user.telefone,
  app_role: user.app_role || user.role,
  available_roles: user.available_roles || user.availableRoles,
  cre: user.cre,
  municipio: user.municipio,
  unidadeEducacional: user.unidadeEducacional || user.unidade_educacional,
  inep: user.inep,
  creSecundaria: user.creSecundaria || user.cre_secundaria,
  municipioSecundaria: user.municipioSecundaria || user.municipio_secundaria,
  unidadeEducacionalSecundaria: user.unidadeEducacionalSecundaria || user.unidade_educacional_secundaria,
  inepSecundaria: user.inepSecundaria || user.inep_secundaria,
  creTerciaria: user.creTerciaria || user.cre_terciaria,
  municipioTerciaria: user.municipioTerciaria || user.municipio_terciaria,
  unidadeEducacionalTerciaria: user.unidadeEducacionalTerciaria || user.unidade_educacional_terciaria,
  inepTerciaria: user.inepTerciaria || user.inep_terciaria,
  isAdminAccount: user.is_admin_account ?? user.isAdminAccount,
  isActive: user.is_active ?? user.isActive
});

class RemoteUser extends RemoteEntity {
  constructor() {
    super({ resource: 'users', normalize: (item) => normalizeUser(item), serialize: serializeUser });
    this.currentUser = null;
  }

  async list(orderBy) {
    const users = await super.list(orderBy);
    return users.map((user) => normalizeUser(user));
  }

  async get(id) {
    const user = await super.get(id);
    return normalizeUser(user);
  }

  async create(data) {
    const created = await super.create(data);
    return normalizeUser(created);
  }

  async update(id, data) {
    const updated = await super.update(id, data);
    return normalizeUser(updated);
  }

  async me() {
    try {
      const response = await httpClient.get('/users/me');
      const normalized = normalizeUser(response);
      this.currentUser = normalized;
      localStorage.setItem('currentUser', JSON.stringify(normalized));
      localStorage.setItem('isAuthenticated', 'true');
      return normalized;
    } catch (error) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        this.currentUser = normalizeUser(parsed);
        return this.currentUser;
      }
      throw error;
    }
  }

  async updateMyUserData(data) {
    const current = await this.me();
    const updated = await this.update(current.id, data);
    this.currentUser = normalizeUser(updated);
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    return this.currentUser;
  }

  async loginWithRedirect() {
    const user = await this.me();
    return user;
  }

  async logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
    return { success: true };
  }
}

export const Form = new RemoteEntity({ resource: 'forms', normalize: normalizeForm, serialize: serializeForm });
export const Submission = new RemoteEntity({ resource: 'submissions', normalize: normalizeSubmission, serialize: serializeSubmission });
export const Escola = new RemoteEntity({ resource: 'escolas', normalize: normalizeEscola, serialize: serializeEscola });
export const ProjetoArteEduca = new RemoteEntity({ resource: 'projetos', normalize: normalizeProjeto, serialize: serializeProjeto });
export const TermoDeCompromisso = new RemoteEntity({ resource: 'termos', normalize: normalizeTermo, serialize: serializeTermo });
export const DeclaracaoCre = new RemoteEntity({ resource: 'declaracoes', normalize: normalizeDeclaracao, serialize: serializeDeclaracao });
export const User = new RemoteUser();