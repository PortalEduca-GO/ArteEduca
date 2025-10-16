# 🎨 Arte Educa - Guia Rápido

## 🚀 Início Rápido

### 1. Instalar Dependências
```bash
npm install
```

### 2. Iniciar Aplicação
```bash
npm run dev
```

Acesse: `http://localhost:5173/`

## 👤 Usuário Padrão

**Login automático com:**
- Email: `dev@localhost.com`
- Nome: Usuário Desenvolvimento
- Perfil: **Admin** (acesso total)

## 🎯 Funcionalidades Principais

### 📝 Formulários
- **Criar Formulário**: Dashboard → "Create New Form"
- **Editar Formulário**: Meus Formulários → Ícone de edição
- **Visualizar**: Clique no olho para ver o formulário
- **Compartilhar**: Copie o link para compartilhar

### 📊 Submissões
- **Ver Respostas**: Meus Formulários → "View Data"
- **Exportar**: CSV ou HTML
- **Deletar**: Clique no ícone de lixeira

### 🎭 Projetos Arte Educa
- **Criar Projeto**: Menu lateral → "Dashboard" → Seção de projetos
- **Tipos disponíveis**:
  - 🎨 Artes Visuais
  - 🎺 Bandas e Fanfarras
  - 🎤 Canto Coral
  - 💃 Dança
  - 👥 Prática de Conjunto
  - 🎭 Teatro

## 🗄️ Banco de Dados Local

### Onde os dados ficam?
- **IndexedDB** do navegador
- **LocalStorage** para usuário atual
- Dados **persistem** entre sessões
- **Exclusivo** para cada navegador

### Ver Dados Armazenados
1. F12 (DevTools)
2. Application → IndexedDB → ArteEducaDB
3. Explore as tabelas

### Resetar Banco
```javascript
// No console do navegador (F12)
indexedDB.deleteDatabase('ArteEducaDB');
localStorage.clear();
location.reload();
```

## 🔄 Alternar Modos

### Modo Local (atual)
```bash
npm run mode:local
```
- Funciona offline
- Dados locais
- Sem necessidade de autenticação externa

### Modo Base44 (produção)
```bash
npm run mode:base44
```
- Requer conexão com Base44
- Autenticação real
- Dados sincronizados

## 🛠️ Comandos Úteis

```bash
npm run dev        # Inicia servidor desenvolvimento
npm run build      # Build de produção
npm run preview    # Preview do build
npm run lint       # Verificar código
```

## 📱 Páginas Disponíveis

- `/` - Dashboard principal
- `/CreateForm` - Criar novo formulário
- `/MyForms` - Meus formulários
- `/FormView?id=xxx` - Visualizar formulário
- `/FormData?id=xxx` - Dados do formulário
- `/ProjetoArteEduca` - Projetos de arte
- `/Profile` - Perfil do usuário
- `/TermoCompromisso` - Termos
- `/GerenciarEscolas` - Gerenciar escolas
- `/GerenciarUsuarios` - Gerenciar usuários
- `/ImportarEscolas` - Importar escolas
- `/DeclaracaoCre` - Declarações CRE

## 💡 Dicas

### Criar Formulário Rápido
1. Dashboard → "Create New Form"
2. Arraste campos da barra lateral
3. Configure cada campo (nome, obrigatório, etc.)
4. Salvar

### Testar Formulário
1. Após criar, clique no ícone de olho
2. Preencha e envie
3. Volte para "View Data" para ver a resposta

### Exportar Dados
1. Vá em "View Data"
2. Clique em "Export CSV" ou "Export HTML"
3. Arquivo será baixado automaticamente

## ⚠️ Limitações Modo Local

- Emails **não são enviados** (apenas log no console)
- Imagens geradas são **placeholders**
- Uploads criam **URLs temporários**
- Dados **não sincronizam** entre navegadores

## 🐛 Problemas Comuns

### Página em branco?
1. Abra o console (F12)
2. Verifique erros
3. Tente: `localStorage.clear()` e recarregue

### Dados não aparecem?
1. Verifique IndexedDB (F12 → Application)
2. Execute `seedDatabase()` no console
3. Recarregue a página

### Build com erro?
```bash
npm run build
```
Se falhar, verifique os logs de erro

## 📚 Documentação Completa

Veja `MODO_DESENVOLVIMENTO.md` para documentação técnica detalhada.

## 🎯 Exemplo de Fluxo Completo

1. **Iniciar**: `npm run dev`
2. **Criar Formulário**: Dashboard → Create New Form
3. **Adicionar Campos**: Arraste Text, Email, Textarea
4. **Salvar**: Clique em "Save Form"
5. **Testar**: Clique no olho → Preencha → Submit
6. **Ver Dados**: View Data → Veja a submissão
7. **Exportar**: Export CSV

---

**Desenvolvido com ❤️ para facilitar o desenvolvimento local**
