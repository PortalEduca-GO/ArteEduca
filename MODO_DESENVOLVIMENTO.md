# Modo Desenvolvimento - Banco de Dados Local

## 📋 Visão Geral

O projeto agora está configurado para funcionar **completamente offline** usando **IndexedDB** como banco de dados local. Todas as funcionalidades do aplicativo funcionam sem necessidade de conexão com o Base44.

## 🎯 Mudanças Implementadas

### 1. **Banco de Dados Local (IndexedDB)**
- Arquivo: `src/api/localDb.js`
- Implementa todas as operações CRUD (Create, Read, Update, Delete)
- Armazena dados localmente no navegador
- Dados persistem entre sessões

### 2. **Entidades Locais**
Todas as entidades estão funcionando localmente:
- ✅ **Forms** - Formulários
- ✅ **Submissions** - Submissões de formulários
- ✅ **User** - Usuários e autenticação
- ✅ **ProjetoArteEduca** - Projetos de arte educação
- ✅ **TermoDeCompromisso** - Termos de compromisso
- ✅ **Escola** - Escolas
- ✅ **DeclaracaoCre** - Declarações CRE

### 3. **Integrações Mockadas**
- Arquivo: `src/api/integrations.js`
- Todas as integrações estão simuladas (SendEmail, GenerateImage, UploadFile, etc.)
- Logs de console para debug

### 4. **Autenticação Local**
- Usuário padrão criado automaticamente: `dev@localhost.com`
- Perfil: **Admin** com todas as permissões
- Dados salvos no localStorage e IndexedDB

## 🚀 Como Usar

### Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```

### Acessar a Aplicação
Abra o navegador em: `http://localhost:5173/`

### Usuário Padrão
- **Email:** dev@localhost.com
- **Nome:** Usuário Desenvolvimento
- **Perfil:** Admin
- **CPF:** 000.000.000-00

## 🔄 Dados de Exemplo

Na primeira execução, o sistema cria automaticamente:
- 1 Formulário de exemplo
- 1 Submissão de exemplo
- 1 Usuário admin padrão

## 🛠️ Funcionalidades Disponíveis

### ✅ Totalmente Funcionais
- Criar, editar e excluir formulários
- Visualizar e responder formulários
- Gerenciar submissões
- Exportar dados (CSV, HTML)
- Criar e gerenciar projetos Arte Educa
- Sistema de autenticação local
- Perfil de usuário
- Dashboard

### ⚠️ Limitações (Modo Local)
- Emails não são enviados (apenas logados no console)
- Imagens geradas são placeholders
- Uploads de arquivo criam URLs temporários
- Dados ficam apenas no navegador atual

## 🔧 Inspeção do Banco de Dados

Para ver os dados armazenados:

1. Abra o DevTools (F12)
2. Vá em **Application** → **Storage** → **IndexedDB**
3. Expanda **ArteEducaDB**
4. Veja as tabelas: forms, submissions, users, projetos, termos, escolas, declaracoes

## 🔄 Resetar o Banco de Dados

Para limpar todos os dados locais:

### Opção 1: Via Console do Navegador
```javascript
indexedDB.deleteDatabase('ArteEducaDB');
localStorage.clear();
location.reload();
```

### Opção 2: Via DevTools
1. F12 → Application → Storage
2. Clique em "Clear site data"

## 📦 Estrutura dos Dados

### Formulário (Form)
```javascript
{
  id: "string",
  title: "string",
  description: "string",
  fields: [...],
  isActive: boolean,
  settings: {...},
  styling: {...},
  created_date: "ISO date",
  updated_date: "ISO date"
}
```

### Submissão (Submission)
```javascript
{
  id: "string",
  formId: "string",
  data: {...},
  submitterName: "string",
  submitterEmail: "string",
  created_date: "ISO date"
}
```

### Usuário (User)
```javascript
{
  id: "string",
  name: "string",
  email: "string",
  app_role: "admin|professor|gestor|articulador",
  cpf: "string",
  cre: "string",
  municipio: "string",
  unidadeEducacional: "string",
  inep: "string",
  created_date: "ISO date"
}
```

## 🔙 Voltar para Base44

Para voltar a usar o Base44 em produção:

### 1. Arquivo `src/api/entities.js`
Comente o código local e descomente as linhas do Base44:
```javascript
// Comentar estas linhas:
// import { LocalForm, LocalSubmission, ... } from './localDb';

// Descomentar estas linhas:
// export const Form = base44.entities.Form;
// export const Submission = base44.entities.Submission;
// ...
```

### 2. Arquivo `src/api/integrations.js`
Comente o código mock e descomente as linhas do Base44:
```javascript
// Comentar o mock
// Descomentar:
// export const Core = base44.integrations.Core;
// ...
```

### 3. Arquivo `src/api/base44Client.js`
Alterar `requiresAuth` para `true`:
```javascript
export const base44 = createClient({
  appId: "68d01ff17e017d39292ccc5f", 
  requiresAuth: true
});
```

## 🐛 Debug

### Ver Logs das Operações
Todas as operações mockadas logam no console:
```
[Mock] SendEmail chamado com: {...}
[Mock] GenerateImage - gerando imagem placeholder
```

### Verificar Estado do Usuário
```javascript
// No console do navegador
JSON.parse(localStorage.getItem('currentUser'))
```

## 📝 Notas Importantes

1. **Dados são locais ao navegador** - Se mudar de navegador, os dados não estarão lá
2. **Limpar cache apaga dados** - Cuidado ao limpar dados do site
3. **Desenvolvimento apenas** - Este modo é para desenvolvimento/testes local
4. **Sem sincronização** - Dados não são sincronizados entre dispositivos

## ✨ Próximos Passos

- [ ] Adicionar import/export de dados
- [ ] Implementar sincronização opcional com Base44
- [ ] Criar interface para gerenciar banco de dados local
- [ ] Adicionar mais dados de exemplo
- [ ] Implementar backup automático

---

**Desenvolvido para facilitar o desenvolvimento local sem dependência de serviços externos.**
