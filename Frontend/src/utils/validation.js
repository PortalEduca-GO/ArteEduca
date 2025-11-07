// Utilitários de validação para o sistema

/**
 * Valida email
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida CPF (formato e dígitos verificadores)
 */
export const validateCPF = (cpf) => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let digit1 = remainder >= 10 ? 0 : remainder;
  
  if (digit1 !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let digit2 = remainder >= 10 ? 0 : remainder;
  
  return digit2 === parseInt(cleanCPF.charAt(10));
};

/**
 * Valida INEP (8 dígitos)
 */
export const validateINEP = (inep) => {
  const cleanINEP = inep.replace(/\D/g, '');
  return cleanINEP.length === 8;
};

/**
 * Valida senha forte
 */
export const validatePassword = (password) => {
  if (password.length < 6) {
    return { valid: false, message: 'A senha deve ter no mínimo 6 caracteres' };
  }
  return { valid: true, message: '' };
};

/**
 * Valida telefone brasileiro
 */
export const validatePhone = (phone) => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

/**
 * Valida se uma data é válida e não está no futuro
 */
export const validateDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  return date instanceof Date && !isNaN(date) && date <= now;
};

/**
 * Valida se data final é posterior à data inicial
 */
export const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start < end;
};

/**
 * Valida campos obrigatórios de um projeto
 */
export const validateProjeto = (projeto) => {
  const errors = [];
  
  // Validar identificação
  if (!projeto.tipoProjeto) {
    errors.push('Tipo de projeto é obrigatório');
  }
  
  // Validar dados do professor
  if (!projeto.identificacao?.professor?.nome) {
    errors.push('Nome do professor é obrigatório');
  }
  if (!projeto.identificacao?.professor?.cpf) {
    errors.push('CPF do professor é obrigatório');
  } else if (!validateCPF(projeto.identificacao.professor.cpf)) {
    errors.push('CPF do professor é inválido');
  }
  
  if (!projeto.identificacao?.professor?.email) {
    errors.push('Email do professor é obrigatório');
  } else if (!validateEmail(projeto.identificacao.professor.email)) {
    errors.push('Email do professor é inválido');
  }
  
  // Validar escola
  if (!projeto.identificacao?.inep) {
    errors.push('INEP da escola é obrigatório');
  } else if (!validateINEP(projeto.identificacao.inep)) {
    errors.push('INEP deve ter 8 dígitos');
  }
  
  if (!projeto.identificacao?.cre) {
    errors.push('CRE é obrigatória');
  }
  
  if (!projeto.identificacao?.municipio) {
    errors.push('Município é obrigatório');
  }
  
  if (!projeto.identificacao?.unidadeEducacional) {
    errors.push('Unidade Educacional é obrigatória');
  }
  
  // Validar modulação (usa o quadro de horário)
  const modulacaoPrincipal = projeto.quadroHorario?.modulacaoPrincipal || [];
  const modulacaoValida = modulacaoPrincipal.some((linha) => {
    if (!linha) return false;
    const horarioValido = typeof linha.horario === 'string' && linha.horario.trim().length > 0;
    const diaMarcado = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'].some((dia) => Boolean(linha[dia]));
    return horarioValido && diaMarcado;
  });
  if (!modulacaoValida) {
    errors.push('Modulação (dias/horários) é obrigatória');
  }

  // Validar período (só se os campos existirem no objeto)
  const periodo = projeto.identificacao?.periodo;
  if (periodo) {
    if (!periodo.inicio) {
      errors.push('Data de início é obrigatória');
    }
    if (!periodo.fim) {
      errors.push('Data de fim é obrigatória');
    }
    if (periodo.inicio && periodo.fim && !validateDateRange(periodo.inicio, periodo.fim)) {
      errors.push('Data de fim deve ser posterior à data de início');
    }
  }
  
  // Validar conteúdo do projeto
  if (!projeto.projeto?.introducao) {
    errors.push('Introdução do projeto é obrigatória');
  }
  
  if (!projeto.projeto?.justificativa) {
    errors.push('Justificativa do projeto é obrigatória');
  }
  
  if (!projeto.projeto?.objetivoGeral) {
    errors.push('Objetivo geral é obrigatório');
  }
  
  if (!projeto.projeto?.objetivosEspecificos || !projeto.projeto.objetivosEspecificos.toString().trim()) {
    errors.push('Pelo menos um objetivo específico é obrigatório');
  }
  
  if (!projeto.projeto?.metodologia || !projeto.projeto.metodologia.trim()) {
    errors.push('Metodologia é obrigatória');
  }
  
  if (!projeto.cronograma?.acoes || projeto.cronograma.acoes.length === 0) {
    errors.push('Cronograma deve ter pelo menos uma ação');
  }
  
  const criteriosAvaliacao = projeto.avaliacao?.criterios ?? projeto.projeto?.avaliacao;
  if (!criteriosAvaliacao || !criteriosAvaliacao.toString().trim()) {
    errors.push('Critérios de avaliação são obrigatórios');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Valida dados de usuário
 */
export const validateUser = (user, isNew = false) => {
  const errors = [];
  
  if (!user.full_name || user.full_name.trim().length < 3) {
    errors.push('Nome completo deve ter no mínimo 3 caracteres');
  }
  
  if (!user.email) {
    errors.push('Email é obrigatório');
  } else if (!validateEmail(user.email)) {
    errors.push('Email inválido');
  }
  
  if (isNew && !user.password) {
    errors.push('Senha é obrigatória');
  }
  
  if (user.password) {
    const passwordValidation = validatePassword(user.password);
    if (!passwordValidation.valid) {
      errors.push(passwordValidation.message);
    }
  }
  
  if (!user.cpf) {
    errors.push('CPF é obrigatório');
  } else if (!validateCPF(user.cpf)) {
    errors.push('CPF inválido');
  }
  
  if (!user.inep) {
    errors.push('INEP da escola principal é obrigatório');
  } else if (!validateINEP(user.inep)) {
    errors.push('INEP deve ter 8 dígitos');
  }
  
  if (!user.app_role) {
    errors.push('Função do usuário é obrigatória');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Valida dados de escola
 */
export const validateEscola = (escola) => {
  const errors = [];
  
  if (!escola.unidadeEducacional || escola.unidadeEducacional.trim().length < 3) {
    errors.push('Nome da Unidade Educacional é obrigatório');
  }
  
  if (!escola.inep) {
    errors.push('INEP é obrigatório');
  } else if (!validateINEP(escola.inep)) {
    errors.push('INEP deve ter 8 dígitos');
  }
  
  if (!escola.cre) {
    errors.push('CRE é obrigatória');
  }
  
  if (!escola.municipio) {
    errors.push('Município é obrigatório');
  }
  
  if (escola.email && !validateEmail(escola.email)) {
    errors.push('Email inválido');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Formata CPF para exibição
 */
export const formatCPF = (cpf) => {
  const clean = cpf.replace(/\D/g, '');
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata telefone para exibição
 */
export const formatPhone = (phone) => {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};
