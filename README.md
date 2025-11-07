# ArteEduca

Monorepo contendo:

- **Frontend**: aplicação Vite + React (`Frontend/`).
- **Backend**: API Express + SQL Server (`Backend/`).

A API usa o schema `arteeduca` no SQL Server para persistir os dados.

## Pré-requisitos

- Windows com PowerShell 7+ (`pwsh`)
- Node.js 18 ou superior (exemplos assumem `C:\\Program Files\\nodejs\\npm.cmd`)
- Acesso ao SQL Server `LOOKER,2733` com a base `EDU_HOM`

## Estrutura

```
ArteEduca/
├─ Backend/            # API Express + SQL Server
│  ├─ scripts/         # SQL utilitários (schema, seeds)
│  └─ src/             # Código da API
├─ Frontend/           # Aplicação Vite + React
│  ├─ scripts/         # Utilitários (ex.: toggle-mode)
│  └─ src/             # Código do front-end
├─ install-deps.ps1    # Instala dependências de front/back
└─ start-dev.ps1       # Inicia front/back em janelas separadas
```

## Scripts auxiliares

Foram adicionados scripts PowerShell para facilitar a configuração e a execução local:

- `install-deps.ps1`: instala dependências do Frontend e do Backend e copia os arquivos `.env` padrão quando ausentes.
- `start-dev.ps1`: inicia Frontend e Backend em janelas separadas. Parâmetros opcionais `-ApiOnly`, `-WebOnly` e `-NodeExecutable`.
- `Backend/start-dev.ps1`: inicializa apenas a API (útil para serviços ou depuração).
- `Backend/install-deps.ps1`: instala somente as dependências da API e garante a presença do `Backend/.env`.

### Uso dos scripts (PowerShell)

```powershell
# Instalar todas as dependências
& 'D:\ArteEduca\install-deps.ps1'

# Iniciar API e front-end (abre duas janelas)
& 'D:\ArteEduca\start-dev.ps1'

# Executar apenas a API
& 'D:\ArteEduca\Backend\start-dev.ps1'

# Definir explicitamente o npm
& 'D:\ArteEduca\start-dev.ps1' -NodeExecutable 'D:\Ferramentas\nodejs\npm.cmd'
```

## Configuração manual (comandos absolutos)

Se preferir, execute os comandos abaixo diretamente no PowerShell. Ajuste os caminhos conforme o local do repositório ou do `npm.cmd`.

### Instalar dependências

```powershell
& 'C:\Program Files\nodejs\npm.cmd' install --prefix 'D:\ArteEduca\Frontend'
& 'C:\Program Files\nodejs\npm.cmd' install --prefix 'D:\ArteEduca\Backend'
```

### Copiar arquivos `.env`

```powershell
Copy-Item -Path 'D:\ArteEduca\Frontend\.env.example' -Destination 'D:\ArteEduca\Frontend\.env' -Force
Copy-Item -Path 'D:\ArteEduca\Backend\.env.example' -Destination 'D:\ArteEduca\Backend\.env' -Force
```

### Rodar em desenvolvimento

Abra duas janelas do PowerShell:

```powershell
# Terminal 1 - API
Set-Location 'D:\ArteEduca\Backend'
& 'C:\Program Files\nodejs\npm.cmd' run dev

# Terminal 2 - Front-end
Set-Location 'D:\ArteEduca\Frontend'
& 'C:\Program Files\nodejs\npm.cmd' run dev
```

A API responde em `http://localhost:3001/api` e o front-end em `http://localhost:5173`.

### Build e preview do front-end

```powershell
& 'C:\Program Files\nodejs\npm.cmd' run build --prefix 'D:\ArteEduca\Frontend'
& 'C:\Program Files\nodejs\npm.cmd' run preview --prefix 'D:\ArteEduca\Frontend'
```

## Banco de dados

- `Backend/scripts/arteeduca_schema.sql` cria todas as tabelas necessárias no schema `arteeduca`.
- Cada tabela possui a coluna `data_json` para armazenar o payload completo enviado pelo front-end.
- Para aplicar o schema no servidor configurado:

```powershell
sqlcmd -S LOOKER,2733 -U eduhom -P 'teste@eduhom#giz' -d EDU_HOM -i 'D:\ArteEduca\Backend\scripts\arteeduca_schema.sql' -I
```
```powershell
sqlcmd -S LOOKER,2733 -U eduhom -P 'teste@eduhom#giz' -d EDU_HOM -i 'D:\ArteEduca\Backend\scripts\seed-admin.sql' -I
```

Revise as credenciais antes de executar em produção. Adapte os caminhos se o repositório estiver em outro diretório ou se estiver utilizando outro SO.