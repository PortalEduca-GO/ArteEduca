// 🧪 Script de Testes e Utilitários para Console do Navegador
// Copie e cole estas funções no console (F12) para testar funcionalidades

// ====== UTILITÁRIOS DE BANCO DE DADOS ======

// Ver todas as tabelas e seus dados
async function verTodosBancoDados() {
  const db = await new Promise((resolve) => {
    const request = indexedDB.open('ArteEducaDB');
    request.onsuccess = () => resolve(request.result);
  });
  
  const stores = ['forms', 'submissions', 'users', 'projetos', 'termos', 'escolas', 'declaracoes'];
  const resultado = {};
  
  for (const storeName of stores) {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const items = await new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
    });
    resultado[storeName] = items;
    console.log(`📊 ${storeName}: ${items.length} registros`);
  }
  
  return resultado;
}

// Resetar banco de dados
async function resetarBanco() {
  const confirmacao = confirm('⚠️ Isso vai apagar TODOS os dados locais. Confirma?');
  if (!confirmacao) return;
  
  indexedDB.deleteDatabase('ArteEducaDB');
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ Banco de dados limpo!');
  setTimeout(() => location.reload(), 1000);
}

// Exportar todos os dados para JSON
async function exportarDados() {
  const dados = await verTodosBancoDados();
  const json = JSON.stringify(dados, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-arteaeduca-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  console.log('✅ Dados exportados!');
}

// Importar dados de JSON (cole o JSON como parâmetro)
async function importarDados(dadosJson) {
  try {
    const dados = typeof dadosJson === 'string' ? JSON.parse(dadosJson) : dadosJson;
    
    const db = await new Promise((resolve) => {
      const request = indexedDB.open('ArteEducaDB');
      request.onsuccess = () => resolve(request.result);
    });
    
    for (const [storeName, items] of Object.entries(dados)) {
      if (!items || !Array.isArray(items)) continue;
      
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      for (const item of items) {
        store.put(item);
      }
      
      await new Promise((resolve) => {
        tx.oncomplete = resolve;
      });
      
      console.log(`✅ Importados ${items.length} registros em ${storeName}`);
    }
    
    console.log('✅ Importação completa!');
    setTimeout(() => location.reload(), 1000);
  } catch (error) {
    console.error('❌ Erro ao importar:', error);
  }
}

// ====== TESTES DE FUNCIONALIDADE ======

// Criar formulário de teste
async function criarFormularioTeste() {
  const { LocalForm } = await import('/src/api/localDb.js');
  
  const form = await LocalForm.create({
    title: 'Formulário de Teste ' + Date.now(),
    description: 'Criado via console para testes',
    fields: [
      { id: 'nome', type: 'text', label: 'Nome Completo', required: true },
      { id: 'email', type: 'email', label: 'E-mail', required: true },
      { id: 'telefone', type: 'phone', label: 'Telefone', required: false },
      { id: 'mensagem', type: 'textarea', label: 'Mensagem', required: false },
      { id: 'data', type: 'date', label: 'Data', required: false },
      { id: 'avaliacao', type: 'rating', label: 'Avaliação', required: false, maxRating: 5 }
    ],
    isActive: true,
    settings: { isPublic: true },
    styling: { backgroundColor: '#f0f0f0' }
  });
  
  console.log('✅ Formulário criado:', form);
  return form;
}

// Criar submissão de teste para um formulário
async function criarSubmissaoTeste(formId) {
  if (!formId) {
    console.error('❌ Forneça um formId');
    return;
  }
  
  const { LocalSubmission } = await import('/src/api/localDb.js');
  
  const submission = await LocalSubmission.create({
    formId: formId,
    data: {
      nome: 'João da Silva Teste',
      email: 'joao.teste@example.com',
      telefone: '(21) 98765-4321',
      mensagem: 'Esta é uma submissão de teste criada via console',
      data: new Date().toISOString().split('T')[0],
      avaliacao: 5
    },
    submitterName: 'João da Silva Teste',
    submitterEmail: 'joao.teste@example.com'
  });
  
  console.log('✅ Submissão criada:', submission);
  return submission;
}

// Criar múltiplos formulários de teste
async function criarFormulariosExemplo() {
  const tipos = [
    { titulo: 'Cadastro de Aluno', campos: ['nome', 'email', 'telefone', 'endereco'] },
    { titulo: 'Avaliação de Curso', campos: ['nome', 'curso', 'avaliacao', 'comentarios'] },
    { titulo: 'Inscrição de Evento', campos: ['nome', 'email', 'evento', 'data'] },
    { titulo: 'Feedback do Projeto', campos: ['nome', 'projeto', 'nota', 'sugestoes'] }
  ];
  
  const forms = [];
  
  for (const tipo of tipos) {
    const form = await criarFormularioTeste();
    form.title = tipo.titulo;
    forms.push(form);
  }
  
  console.log(`✅ Criados ${forms.length} formulários de exemplo`);
  return forms;
}

// Ver estatísticas do banco
async function estatisticas() {
  const dados = await verTodosBancoDados();
  
  console.log('\n📊 ESTATÍSTICAS DO BANCO DE DADOS\n');
  console.log('━'.repeat(50));
  
  Object.entries(dados).forEach(([tabela, items]) => {
    console.log(`${tabela.padEnd(20)} : ${items.length.toString().padStart(3)} registros`);
  });
  
  console.log('━'.repeat(50));
  
  const total = Object.values(dados).reduce((sum, items) => sum + items.length, 0);
  console.log(`${'TOTAL'.padEnd(20)} : ${total.toString().padStart(3)} registros`);
  console.log('\n');
  
  return dados;
}

// Ver usuário atual
function verUsuarioAtual() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  console.log('👤 Usuário Atual:', user);
  return user;
}

// Alterar perfil do usuário
async function alterarPerfil(novoRole) {
  const roles = ['admin', 'professor', 'gestor', 'articulador'];
  if (!roles.includes(novoRole)) {
    console.error(`❌ Role inválido. Use: ${roles.join(', ')}`);
    return;
  }
  
  const { LocalUser } = await import('/src/api/localDb.js');
  const user = await LocalUser.me();
  
  await LocalUser.updateMyUserData({ app_role: novoRole });
  
  console.log(`✅ Perfil alterado para: ${novoRole}`);
  setTimeout(() => location.reload(), 1000);
}

// ====== INFORMAÇÕES ======

console.log(`
🎨 ARTE EDUCA - CONSOLE DE TESTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 FUNÇÕES DISPONÍVEIS:

🗄️ BANCO DE DADOS:
  verTodosBancoDados()       - Ver todos os dados
  resetarBanco()             - Limpar tudo
  exportarDados()            - Exportar para JSON
  importarDados(json)        - Importar de JSON
  estatisticas()             - Ver estatísticas

🧪 TESTES:
  criarFormularioTeste()     - Criar 1 formulário
  criarSubmissaoTeste(id)    - Criar submissão
  criarFormulariosExemplo()  - Criar 4 formulários

👤 USUÁRIO:
  verUsuarioAtual()          - Ver usuário logado
  alterarPerfil('admin')     - Mudar perfil do usuário

💡 EXEMPLOS:

// Ver tudo
await verTodosBancoDados()

// Ver estatísticas
await estatisticas()

// Criar formulário
const form = await criarFormularioTeste()

// Criar submissão para o formulário
await criarSubmissaoTeste(form.id)

// Criar vários formulários
await criarFormulariosExemplo()

// Exportar backup
await exportarDados()

// Mudar para professor
await alterarPerfil('professor')

// Resetar tudo
await resetarBanco()

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Exportar funções globalmente para facilitar uso
window.dbUtils = {
  verTodosBancoDados,
  resetarBanco,
  exportarDados,
  importarDados,
  estatisticas,
  criarFormularioTeste,
  criarSubmissaoTeste,
  criarFormulariosExemplo,
  verUsuarioAtual,
  alterarPerfil
};

console.log('✅ Utilitários carregados! Use window.dbUtils para acessar todas as funções.');
