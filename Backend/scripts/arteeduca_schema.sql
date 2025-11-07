/*
    Arte Educa - SQL Server schema
    Schema: arteeduca
    Instructions:
      1. Execute this script connected to the EDU_HOM database.
      2. The script will create the arteeduca schema (if it does not exist) and all required tables.
*/

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'arteeduca')
BEGIN
    EXEC('CREATE SCHEMA arteeduca AUTHORIZATION dbo');
END;
GO

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */
CREATE TABLE arteeduca.users (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    external_id NVARCHAR(50) NULL,
    full_name NVARCHAR(200) NOT NULL,
    email NVARCHAR(320) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    cpf NVARCHAR(14) NOT NULL,
    rg NVARCHAR(20) NULL,
    data_nascimento DATE NULL,
    telefone NVARCHAR(20) NULL,
    app_role NVARCHAR(20) NOT NULL DEFAULT 'professor',
    available_roles NVARCHAR(200) NULL,
    cre NVARCHAR(50) NULL,
    municipio NVARCHAR(120) NULL,
    unidade_educacional NVARCHAR(200) NULL,
    inep NVARCHAR(20) NULL,
    cre_secundaria NVARCHAR(50) NULL,
    municipio_secundaria NVARCHAR(120) NULL,
    unidade_educacional_secundaria NVARCHAR(200) NULL,
    inep_secundaria NVARCHAR(20) NULL,
    cre_terciaria NVARCHAR(50) NULL,
    municipio_terciaria NVARCHAR(120) NULL,
    unidade_educacional_terciaria NVARCHAR(200) NULL,
    inep_terciaria NVARCHAR(20) NULL,
    is_admin_account BIT NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    data_json NVARCHAR(MAX) NULL,
    row_version ROWVERSION NOT NULL,
    CONSTRAINT PK_users PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_users_email UNIQUE (email),
    CONSTRAINT UQ_users_cpf UNIQUE (cpf),
    CONSTRAINT CK_users_app_role CHECK (app_role IN ('admin','gestor','articulador','professor'))
);
GO

/* -------------------------------------------------------------------------- */
/* Schools                                                                    */
/* -------------------------------------------------------------------------- */
CREATE TABLE arteeduca.escolas (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    inep NVARCHAR(20) NOT NULL,
    nome NVARCHAR(200) NOT NULL,
    cre NVARCHAR(50) NULL,
    municipio NVARCHAR(120) NULL,
    endereco NVARCHAR(250) NULL,
    telefone NVARCHAR(20) NULL,
    email NVARCHAR(120) NULL,
    created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    data_json NVARCHAR(MAX) NULL,
    row_version ROWVERSION NOT NULL,
    CONSTRAINT PK_escolas PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_escolas_inep UNIQUE (inep)
);
GO

/* -------------------------------------------------------------------------- */
/* Forms                                                                      */
/* -------------------------------------------------------------------------- */
CREATE TABLE arteeduca.forms (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    external_id NVARCHAR(50) NULL,
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX) NULL,
    fields_json NVARCHAR(MAX) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    settings_json NVARCHAR(MAX) NULL,
    styling_json NVARCHAR(MAX) NULL,
    created_by_user_id UNIQUEIDENTIFIER NULL,
    created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    data_json NVARCHAR(MAX) NULL,
    row_version ROWVERSION NOT NULL,
    CONSTRAINT PK_forms PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_forms_created_by FOREIGN KEY (created_by_user_id) REFERENCES arteeduca.users(id) ON DELETE SET NULL
);
GO

CREATE TABLE arteeduca.form_submissions (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    external_id NVARCHAR(50) NULL,
    form_id UNIQUEIDENTIFIER NOT NULL,
    data_json NVARCHAR(MAX) NOT NULL,
    submitter_name NVARCHAR(200) NULL,
    submitter_email NVARCHAR(320) NULL,
    submitted_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_form_submissions PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_form_submissions_form FOREIGN KEY (form_id) REFERENCES arteeduca.forms(id) ON DELETE CASCADE
);
GO

/* -------------------------------------------------------------------------- */
/* Projetos Arte Educa                                                        */
/* -------------------------------------------------------------------------- */
CREATE TABLE arteeduca.projetos (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    external_id NVARCHAR(50) NULL,
    tipo_projeto NVARCHAR(50) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'rascunho',
    status_gestor NVARCHAR(20) NOT NULL DEFAULT 'pendente',
    status_cre NVARCHAR(20) NOT NULL DEFAULT 'pendente',
    justificativa_rejeicao NVARCHAR(MAX) NULL,
    numero_processo_sei NVARCHAR(20) NULL,
    data_submissao DATETIME2(0) NULL,
    data_aprovacao DATETIME2(0) NULL,
    created_by_user_id UNIQUEIDENTIFIER NULL,
    created_by_email NVARCHAR(320) NULL,
    cre NVARCHAR(50) NULL,
    municipio NVARCHAR(120) NULL,
    unidade_educacional NVARCHAR(200) NULL,
    tipo_matriz NVARCHAR(20) NULL,
    inep NVARCHAR(20) NULL,
    quantidade_estudantes INT NULL,
    quantidade_alunos_fundamental2 INT NULL,
    quantidade_alunos_medio INT NULL,
    professor_nome NVARCHAR(200) NULL,
    professor_cpf NVARCHAR(14) NULL,
    professor_rg NVARCHAR(20) NULL,
    professor_data_nascimento DATE NULL,
    professor_telefone NVARCHAR(20) NULL,
    professor_email NVARCHAR(320) NULL,
    introducao NVARCHAR(MAX) NULL,
    justificativa NVARCHAR(MAX) NULL,
    objetivo_geral NVARCHAR(MAX) NULL,
    objetivos_especificos NVARCHAR(MAX) NULL,
    metodologia NVARCHAR(MAX) NULL,
    avaliacao NVARCHAR(MAX) NULL,
    referencias NVARCHAR(MAX) NULL,
    created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    data_json NVARCHAR(MAX) NULL,
    row_version ROWVERSION NOT NULL,
    CONSTRAINT PK_projetos PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_projetos_external_id UNIQUE (external_id),
    CONSTRAINT CK_projetos_status CHECK (status IN ('rascunho','enviado','aprovado','rejeitado')),
    CONSTRAINT CK_projetos_status_gestor CHECK (status_gestor IN ('pendente','validado','rejeitado')),
    CONSTRAINT CK_projetos_status_cre CHECK (status_cre IN ('pendente','validado','rejeitado')),
    CONSTRAINT CK_projetos_tipo_matriz CHECK (tipo_matriz IS NULL OR tipo_matriz IN ('matricular','projetos')),
    CONSTRAINT FK_projetos_created_by FOREIGN KEY (created_by_user_id) REFERENCES arteeduca.users(id) ON DELETE SET NULL
);
GO

CREATE INDEX IX_projetos_status ON arteeduca.projetos (status);
CREATE INDEX IX_projetos_inep ON arteeduca.projetos (inep);
GO

CREATE TABLE arteeduca.projeto_etapas_ensino (
    id INT IDENTITY(1,1) NOT NULL,
    projeto_id UNIQUEIDENTIFIER NOT NULL,
    etapa NVARCHAR(30) NOT NULL,
    CONSTRAINT PK_projeto_etapas PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_projeto_etapas_projeto FOREIGN KEY (projeto_id) REFERENCES arteeduca.projetos(id) ON DELETE CASCADE,
    CONSTRAINT CK_projeto_etapas CHECK (etapa IN ('fundamental2','medio'))
);
GO

CREATE TABLE arteeduca.projeto_funcoes (
    id INT IDENTITY(1,1) NOT NULL,
    projeto_id UNIQUEIDENTIFIER NOT NULL,
    campo NVARCHAR(80) NOT NULL,
    valor_texto NVARCHAR(255) NULL,
    valor_boolean BIT NULL,
    CONSTRAINT PK_projeto_funcoes PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_projeto_funcoes_projeto FOREIGN KEY (projeto_id) REFERENCES arteeduca.projetos(id) ON DELETE CASCADE
);
GO

CREATE TABLE arteeduca.projeto_recursos (
    id INT IDENTITY(1,1) NOT NULL,
    projeto_id UNIQUEIDENTIFIER NOT NULL,
    ordem INT NOT NULL DEFAULT 1,
    material NVARCHAR(200) NOT NULL,
    quantidade NVARCHAR(50) NULL,
    CONSTRAINT PK_projeto_recursos PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_projeto_recursos_projeto FOREIGN KEY (projeto_id) REFERENCES arteeduca.projetos(id) ON DELETE CASCADE
);
GO

CREATE TABLE arteeduca.projeto_turnos (
    id INT IDENTITY(1,1) NOT NULL,
    projeto_id UNIQUEIDENTIFIER NOT NULL,
    turno NVARCHAR(20) NOT NULL,
    CONSTRAINT PK_projeto_turnos PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_projeto_turnos_projeto FOREIGN KEY (projeto_id) REFERENCES arteeduca.projetos(id) ON DELETE CASCADE,
    CONSTRAINT CK_projeto_turnos_turno CHECK (turno IN ('matutino','vespertino','noturno','entreTurno','sabado'))
);
GO

CREATE TABLE arteeduca.projeto_modulacao (
    id INT IDENTITY(1,1) NOT NULL,
    projeto_id UNIQUEIDENTIFIER NOT NULL,
    ordem INT NOT NULL,
    horario NVARCHAR(50) NULL,
    segunda BIT NOT NULL DEFAULT 0,
    terca BIT NOT NULL DEFAULT 0,
    quarta BIT NOT NULL DEFAULT 0,
    quinta BIT NOT NULL DEFAULT 0,
    sexta BIT NOT NULL DEFAULT 0,
    sabado BIT NOT NULL DEFAULT 0,
    CONSTRAINT PK_projeto_modulacao PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_projeto_modulacao_projeto FOREIGN KEY (projeto_id) REFERENCES arteeduca.projetos(id) ON DELETE CASCADE
);
GO

CREATE TABLE arteeduca.projeto_plano_anual (
    id INT IDENTITY(1,1) NOT NULL,
    projeto_id UNIQUEIDENTIFIER NOT NULL,
    semestre TINYINT NOT NULL,
    ordem INT NOT NULL,
    habilidade NVARCHAR(MAX) NOT NULL,
    objeto_conhecimento NVARCHAR(500) NULL,
    desenvolvimento_conteudo NVARCHAR(MAX) NULL,
    CONSTRAINT PK_projeto_plano PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_projeto_plano_projeto FOREIGN KEY (projeto_id) REFERENCES arteeduca.projetos(id) ON DELETE CASCADE,
    CONSTRAINT CK_projeto_plano_semestre CHECK (semestre IN (1,2))
);
GO

CREATE TABLE arteeduca.projeto_cronograma (
    id INT IDENTITY(1,1) NOT NULL,
    projeto_id UNIQUEIDENTIFIER NOT NULL,
    ordem INT NOT NULL,
    acao NVARCHAR(200) NOT NULL,
    janeiro BIT NOT NULL DEFAULT 0,
    fevereiro BIT NOT NULL DEFAULT 0,
    marco BIT NOT NULL DEFAULT 0,
    abril BIT NOT NULL DEFAULT 0,
    maio BIT NOT NULL DEFAULT 0,
    junho BIT NOT NULL DEFAULT 0,
    agosto BIT NOT NULL DEFAULT 0,
    setembro BIT NOT NULL DEFAULT 0,
    outubro BIT NOT NULL DEFAULT 0,
    novembro BIT NOT NULL DEFAULT 0,
    dezembro BIT NOT NULL DEFAULT 0,
    CONSTRAINT PK_projeto_cronograma PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_projeto_cronograma_projeto FOREIGN KEY (projeto_id) REFERENCES arteeduca.projetos(id) ON DELETE CASCADE
);
GO

/* -------------------------------------------------------------------------- */
/* Termos de Compromisso                                                      */
/* -------------------------------------------------------------------------- */
CREATE TABLE arteeduca.termos_compromisso (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    projeto_id UNIQUEIDENTIFIER NOT NULL,
    unidade_educacional_id NVARCHAR(20) NULL,
    gestor_nome NVARCHAR(200) NULL,
    gestor_cpf NVARCHAR(14) NULL,
    gestor_rg NVARCHAR(20) NULL,
    portaria NVARCHAR(50) NULL,
    professores NVARCHAR(MAX) NULL,
    conteudo NVARCHAR(MAX) NOT NULL,
    validado BIT NOT NULL DEFAULT 0,
    data_validacao DATETIME2(0) NULL,
    created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    data_json NVARCHAR(MAX) NULL,
    row_version ROWVERSION NOT NULL,
    CONSTRAINT PK_termos_compromisso PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_termos_compromisso_projeto FOREIGN KEY (projeto_id) REFERENCES arteeduca.projetos(id) ON DELETE CASCADE
);
GO

/* -------------------------------------------------------------------------- */
/* Declaração CRE                                                             */
/* -------------------------------------------------------------------------- */
CREATE TABLE arteeduca.declaracoes_cre (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    projeto_id UNIQUEIDENTIFIER NOT NULL,
    conteudo NVARCHAR(MAX) NOT NULL,
    validado BIT NOT NULL DEFAULT 0,
    data_validacao DATETIME2(0) NULL,
    created_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    data_json NVARCHAR(MAX) NULL,
    row_version ROWVERSION NOT NULL,
    CONSTRAINT PK_declaracoes_cre PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_declaracoes_cre_projeto FOREIGN KEY (projeto_id) REFERENCES arteeduca.projetos(id) ON DELETE CASCADE
);
GO

/* -------------------------------------------------------------------------- */
/* Auxiliar: histórico de status (opcional, mas útil para auditoria)          */
/* -------------------------------------------------------------------------- */
CREATE TABLE arteeduca.projeto_status_logs (
    id INT IDENTITY(1,1) NOT NULL,
    projeto_id UNIQUEIDENTIFIER NOT NULL,
    status NVARCHAR(20) NOT NULL,
    status_gestor NVARCHAR(20) NULL,
    status_cre NVARCHAR(20) NULL,
    comentario NVARCHAR(400) NULL,
    changed_by_user_id UNIQUEIDENTIFIER NULL,
    changed_at DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT PK_projeto_status_logs PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_projeto_status_logs_projeto FOREIGN KEY (projeto_id) REFERENCES arteeduca.projetos(id) ON DELETE CASCADE,
    CONSTRAINT FK_projeto_status_logs_user FOREIGN KEY (changed_by_user_id) REFERENCES arteeduca.users(id) ON DELETE SET NULL
);
GO

/* -------------------------------------------------------------------------- */
/* Recommended indexes                                                        */
/* -------------------------------------------------------------------------- */
CREATE INDEX IX_users_app_role ON arteeduca.users (app_role);
CREATE INDEX IX_users_inep ON arteeduca.users (inep);
CREATE INDEX IX_form_submissions_form_id ON arteeduca.form_submissions (form_id);
CREATE INDEX IX_termos_compromisso_projeto ON arteeduca.termos_compromisso (projeto_id);
CREATE INDEX IX_declaracoes_cre_projeto ON arteeduca.declaracoes_cre (projeto_id);
GO

/* Optional: helper trigger to keep updated_at in sync for main entities */
CREATE OR ALTER TRIGGER arteeduca.trg_users_touch
ON arteeduca.users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE u
        SET updated_at = SYSDATETIME()
    FROM arteeduca.users AS u
    INNER JOIN inserted AS i ON u.id = i.id;
END;
GO

CREATE OR ALTER TRIGGER arteeduca.trg_forms_touch
ON arteeduca.forms
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE f
        SET updated_at = SYSDATETIME()
    FROM arteeduca.forms AS f
    INNER JOIN inserted AS i ON f.id = i.id;
END;
GO

CREATE OR ALTER TRIGGER arteeduca.trg_projetos_touch
ON arteeduca.projetos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE p
        SET updated_at = SYSDATETIME()
    FROM arteeduca.projetos AS p
    INNER JOIN inserted AS i ON p.id = i.id;
END;
GO

CREATE OR ALTER TRIGGER arteeduca.trg_termos_touch
ON arteeduca.termos_compromisso
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE t
        SET updated_at = SYSDATETIME()
    FROM arteeduca.termos_compromisso AS t
    INNER JOIN inserted AS i ON t.id = i.id;
END;
GO

CREATE OR ALTER TRIGGER arteeduca.trg_declaracoes_touch
ON arteeduca.declaracoes_cre
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE d
        SET updated_at = SYSDATETIME()
    FROM arteeduca.declaracoes_cre AS d
    INNER JOIN inserted AS i ON d.id = i.id;
END;
GO

/* End of schema */
