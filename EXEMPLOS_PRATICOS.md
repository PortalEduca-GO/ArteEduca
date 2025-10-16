# 🎓 EXEMPLOS PRÁTICOS - Arte Educa Local

## 🎯 Cenários Reais de Uso

---

## 📝 Exemplo 1: Criar e Testar um Formulário Completo

### Passo a Passo

1. **Acessar**: http://localhost:5173/

2. **Ir para Create Form**:
   - Clique em "Create New Form" no Dashboard
   - Ou vá direto para `/CreateForm`

3. **Configurar Formulário**:
   ```
   Título: Inscrição Projeto de Dança 2025
   Descrição: Formulário para inscrição no projeto de dança da escola
   ```

4. **Adicionar Campos** (arrastar da barra lateral):
   - **Text**: "Nome Completo" (obrigatório)
   - **Email**: "E-mail do Responsável" (obrigatório)
   - **Phone**: "Telefone de Contato"
   - **Date**: "Data de Nascimento"
   - **Select**: "Turma" com opções: 1º Ano, 2º Ano, 3º Ano
   - **Radio**: "Período" com opções: Manhã, Tarde
   - **Textarea**: "Por que quer participar?"
   - **Checkbox**: "Autorizo participação" (obrigatório)

5. **Salvar**: Clique em "Save Form"

6. **Testar**:
   - Vá para "My Forms"
   - Clique no ícone de olho 👁️
   - Preencha o formulário
   - Clique em "Submit"

7. **Ver Respostas**:
   - Volte para "My Forms"
   - Clique em "View Data"
   - Veja a submissão que você criou

8. **Exportar**:
   - Clique em "Export CSV"
   - Abra o arquivo no Excel/Google Sheets

---

## 🎭 Exemplo 2: Criar um Projeto Arte Educa

### Via Interface

1. **Acessar Dashboard**

2. **Clicar em um tipo de projeto**:
   - 🎨 Artes Visuais
   - 🎺 Bandas e Fanfarras
   - 🎤 Canto Coral
   - 💃 Dança
   - 👥 Prática de Conjunto
   - 🎭 Teatro

3. **Preencher Dados**:
   ```
   Nome do Projeto: Dança Contemporânea na Escola
   Linguagem: Dança
   Modalidade: Oficina Regular
   Número de Participantes: 30
   Período: Tarde
   Dias da Semana: Segunda, Quarta, Sexta
   Carga Horária Semanal: 6 horas
   ```

4. **Dados do Professor**:
   ```
   Nome: Maria Silva Santos
   CPF: 123.456.789-00
   Matrícula: 12345
   Formação: Superior em Dança
   ```

5. **Salvar Projeto**

---

## 🧪 Exemplo 3: Usar Console de Testes

### Abrir Console (F12) e executar:

```javascript
// Ver estatísticas
await estatisticas()

// Criar formulário de teste
const form = await criarFormularioTeste()
console.log('ID do formulário:', form.id)

// Criar 5 submissões para este formulário
for (let i = 1; i <= 5; i++) {
  await criarSubmissaoTeste(form.id)
  console.log(`Submissão ${i} criada`)
}

// Ver todos os dados
const dados = await verTodosBancoDados()
console.log('Total de forms:', dados.forms.length)
console.log('Total de submissions:', dados.submissions.length)

// Exportar backup
await exportarDados()
```

---

## 👥 Exemplo 4: Testar Diferentes Perfis

### Alternar entre perfis de usuário:

```javascript
// No console (F12)

// Virar Professor
await alterarPerfil('professor')
// Página recarrega - agora você vê a visão de professor

// Virar Gestor
await alterarPerfil('gestor')
// Página recarrega - agora você vê a visão de gestor

// Virar Articulador
await alterarPerfil('articulador')
// Página recarrega - agora você vê a visão de articulador

// Voltar para Admin
await alterarPerfil('admin')
// Página recarrega - agora você tem acesso total novamente
```

---

## 📊 Exemplo 5: Gerenciar Dados em Massa

### Script para criar múltiplos itens:

```javascript
// No console (F12)

// Criar 10 formulários de exemplo
const forms = [];
for (let i = 1; i <= 10; i++) {
  const form = await criarFormularioTeste();
  form.title = `Formulário ${i} - Teste em Massa`;
  forms.push(form);
  console.log(`Criado: ${form.title}`);
}

// Para cada formulário, criar 3 submissões
for (const form of forms) {
  for (let j = 1; j <= 3; j++) {
    await criarSubmissaoTeste(form.id);
  }
  console.log(`3 submissões criadas para ${form.title}`);
}

// Ver resultado
await estatisticas()
```

---

## 🔍 Exemplo 6: Buscar e Filtrar Dados

### No console:

```javascript
// Buscar formulários por título
const dados = await verTodosBancoDados();
const formsComTeste = dados.forms.filter(f => 
  f.title.toLowerCase().includes('teste')
);
console.log('Formulários com "teste":', formsComTeste);

// Buscar submissões recentes (últimas 24h)
const ontem = new Date(Date.now() - 24*60*60*1000);
const submissoesRecentes = dados.submissions.filter(s => 
  new Date(s.created_date) > ontem
);
console.log('Submissões últimas 24h:', submissoesRecentes.length);

// Contar submissões por formulário
const countPorForm = {};
dados.submissions.forEach(s => {
  countPorForm[s.formId] = (countPorForm[s.formId] || 0) + 1;
});
console.table(countPorForm);
```

---

## 💾 Exemplo 7: Backup e Restauração

### Fazer Backup:

```javascript
// No console (F12)
await exportarDados()
// Arquivo JSON será baixado
```

### Restaurar Backup:

1. Abra o arquivo JSON baixado
2. Copie todo o conteúdo
3. No console:

```javascript
// Cole o JSON copiado
const backup = {
  // ... conteúdo colado aqui
};

await importarDados(backup)
// Página recarrega com dados restaurados
```

---

## 🎨 Exemplo 8: Customizar Formulário

### Via Interface:

1. Criar formulário
2. Para cada campo, configurar:
   - **Estilo**: Cores, fontes
   - **Validação**: Min/max, regex
   - **Ajuda**: Texto de auxílio
   - **Placeholder**: Texto exemplo

### Exemplo de campo customizado:

```javascript
{
  id: 'cpf',
  type: 'text',
  label: 'CPF',
  required: true,
  placeholder: '000.000.000-00',
  helpText: 'Digite apenas números',
  validation: {
    pattern: '\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}',
    message: 'CPF inválido'
  }
}
```

---

## 📈 Exemplo 9: Analisar Dados de Submissões

### No console:

```javascript
const dados = await verTodosBancoDados();

// Estatísticas por período
const hoje = new Date().toISOString().split('T')[0];
const submissoesHoje = dados.submissions.filter(s => 
  s.created_date.startsWith(hoje)
);

console.log('Submissões hoje:', submissoesHoje.length);

// Formulários mais populares
const popularidade = {};
dados.submissions.forEach(s => {
  const form = dados.forms.find(f => f.id === s.formId);
  if (form) {
    popularidade[form.title] = (popularidade[form.title] || 0) + 1;
  }
});

console.table(popularidade);

// Taxa de resposta por campo
const form = dados.forms[0];
if (form) {
  const respostas = dados.submissions.filter(s => s.formId === form.id);
  
  form.fields.forEach(field => {
    const respondido = respostas.filter(s => s.data[field.id]).length;
    const taxa = (respondido / respostas.length * 100).toFixed(1);
    console.log(`${field.label}: ${taxa}% responderam`);
  });
}
```

---

## 🧹 Exemplo 10: Limpar Dados Antigos

### Limpar submissões antigas:

```javascript
// No console (F12)

// Importar módulos
const { LocalSubmission } = await import('/src/api/localDb.js');

// Buscar submissões antigas (mais de 30 dias)
const diasAtras = 30;
const dataLimite = new Date(Date.now() - diasAtras * 24*60*60*1000);

const submissions = await LocalSubmission.list();
const antigasIds = submissions
  .filter(s => new Date(s.created_date) < dataLimite)
  .map(s => s.id);

console.log(`Encontradas ${antigasIds.length} submissões antigas`);

// Confirmar antes de deletar
if (confirm(`Deletar ${antigasIds.length} submissões?`)) {
  for (const id of antigasIds) {
    await LocalSubmission.delete(id);
  }
  console.log('✅ Submissões antigas deletadas');
  location.reload();
}
```

---

## 🎯 Exemplo 11: Workflow Completo

### Cenário: Escola fazendo inscrição para projeto

1. **Professor cria formulário**:
   - Vai em Create Form
   - Cria "Inscrição Dança 2025"
   - Adiciona campos necessários
   - Salva

2. **Professor compartilha**:
   - My Forms → Copiar link
   - Envia para alunos/responsáveis

3. **Alunos preenchem**:
   - Acessam o link
   - Preenchem o formulário
   - Submetem

4. **Professor analisa**:
   - My Forms → View Data
   - Vê todas as inscrições
   - Exporta para CSV

5. **Professor cria projeto**:
   - Dashboard → Dança
   - Preenche dados do projeto
   - Com base nas inscrições
   - Salva

6. **Gestor valida**:
   - Vê projeto pendente
   - Analisa
   - Valida ou solicita correção

7. **Admin aprova**:
   - Dashboard geral
   - Vê todos os projetos
   - Aprova projeto final
   - Adiciona número SEI

---

## 💡 Dicas Finais

### Performance
- Não criar mais de 1000 registros por tabela em modo local
- Fazer backup regular dos dados
- Limpar dados antigos periodicamente

### Debug
- Sempre use o console (F12) para ver erros
- Use `await estatisticas()` para verificar estado
- Use `verUsuarioAtual()` para ver perfil ativo

### Testes
- Teste cada funcionalidade após criar
- Use dados realistas nos testes
- Sempre teste a exportação antes de confiar nela

---

🎨 **Arte Educa** - Exemplos práticos para desenvolvimento eficiente!
