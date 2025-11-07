// Utilitários para testar a API do Arte Educa diretamente pelo console do navegador
// Todas as operações abaixo utilizam o backend SQL Server configurado pela aplicação

const API_BASE_URL = (window.ARTE_EDUCA_API_BASE || 'http://localhost:3001/api').replace(/\/$/, '')

const buildHeaders = (extra = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...extra
  }

  try {
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      if (parsed?.id) {
        headers['x-user-id'] = parsed.id
      }
    }
  } catch (error) {
    console.warn('Não foi possível ler currentUser do localStorage:', error)
  }

  return headers
}

const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`, {
    method: 'GET',
    ...options,
    headers: buildHeaders(options.headers || {})
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || response.statusText)
  }

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  return contentType.includes('application/json') ? response.json() : response.text()
}

const RESOURCES = ['forms', 'submissions', 'users', 'projetos', 'termos', 'escolas', 'declaracoes']

export async function verTodosBancoDados() {
  const resultado = {}

  for (const resource of RESOURCES) {
    const dados = await apiRequest(`/${resource}`)
    resultado[resource] = dados
    console.log(`📊 ${resource}: ${Array.isArray(dados) ? dados.length : 0} registros`)
  }

  return resultado
}

export async function estatisticas() {
  const dados = await verTodosBancoDados()

  console.log('\n📊 ESTATÍSTICAS DO BANCO DE DADOS (SQL Server)\n')
  console.log('━'.repeat(50))

  Object.entries(dados).forEach(([tabela, items]) => {
    const quantidade = Array.isArray(items) ? items.length : 0
    console.log(`${tabela.padEnd(20)} : ${quantidade.toString().padStart(3)} registros`)
  })

  console.log('━'.repeat(50))
  const total = Object.values(dados).reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0)
  console.log(`${'TOTAL'.padEnd(20)} : ${total.toString().padStart(3)} registros`)
  console.log('\n')

  return dados
}

export async function exportarDados() {
  const dados = await verTodosBancoDados()
  const json = JSON.stringify(dados, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `backup-arteeduca-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  console.log('✅ Dados exportados da API (SQL Server)!')
}

const sampleFormPayload = () => ({
  title: `Formulário de Teste ${new Date().toISOString()}`,
  description: 'Criado via console para testes',
  fields: [
    { id: 'nome', type: 'text', label: 'Nome Completo', required: true },
    { id: 'email', type: 'email', label: 'E-mail', required: true },
    { id: 'telefone', type: 'text', label: 'Telefone', required: false },
    { id: 'mensagem', type: 'textarea', label: 'Mensagem', required: false }
  ],
  isActive: true,
  settings: { isPublic: true },
  styling: { backgroundColor: '#f0f0f0' }
})

export async function criarFormularioTeste() {
  const form = await apiRequest('/forms', {
    method: 'POST',
    body: JSON.stringify(sampleFormPayload())
  })

  console.log('✅ Formulário criado na API:', form)
  return form
}

export async function criarSubmissaoTeste(formId) {
  if (!formId) {
    throw new Error('Informe o formId para gerar a submissão')
  }

  const submission = await apiRequest('/submissions', {
    method: 'POST',
    body: JSON.stringify({
      formId,
      data: {
        nome: 'João da Silva Teste',
        email: 'joao.teste@example.com',
        mensagem: 'Submissão criada via console',
        telefone: '(62) 90000-0000'
      },
      submitterName: 'João da Silva Teste',
      submitterEmail: 'joao.teste@example.com'
    })
  })

  console.log('✅ Submissão criada na API:', submission)
  return submission
}

export async function verUsuarioAtual() {
  const usuario = await apiRequest('/users/me')
  console.log('👤 Usuário atual (API):', usuario)
  return usuario
}

export async function alterarPerfil(novoRole) {
  const roles = ['admin', 'professor', 'gestor', 'articulador']
  if (!roles.includes(novoRole)) {
    throw new Error(`Role inválido. Utilize: ${roles.join(', ')}`)
  }

  const user = await verUsuarioAtual()
  await apiRequest(`/users/${user.id}`, {
    method: 'PUT',
    body: JSON.stringify({ app_role: novoRole })
  })

  console.log(`✅ Perfil atualizado para ${novoRole}. Recarregue a página para refletir as permissões.`)
}

console.log(`
🎨 ARTE EDUCA - SQL SERVER CONSOLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API Base: ${API_BASE_URL}

📚 FUNÇÕES DISPONÍVEIS:

🗄️ DADOS:
  await verTodosBancoDados()
  await estatisticas()
  await exportarDados()

🧪 TESTES:
  const form = await criarFormularioTeste()
  await criarSubmissaoTeste(form.id)

👤 USUÁRIO:
  await verUsuarioAtual()
  await alterarPerfil('gestor')

💡 Todas as operações acima utilizam o backend SQL Server configurado no projeto.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)

window.verTodosBancoDados = verTodosBancoDados
window.estatisticas = estatisticas
window.exportarDados = exportarDados
window.criarFormularioTeste = criarFormularioTeste
window.criarSubmissaoTeste = criarSubmissaoTeste
window.verUsuarioAtual = verUsuarioAtual
window.alterarPerfil = alterarPerfil
window._arteEducaApiBase = API_BASE_URL
