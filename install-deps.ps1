[CmdletBinding()]
param (
    [string]$NodeExecutable = "C:\Program Files\nodejs\npm.cmd",
    [string]$RepoPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $RepoPath) {
    $RepoPath = $PSScriptRoot
}

$RepoPath = [System.IO.Path]::GetFullPath($RepoPath)
$frontendPath = Join-Path $RepoPath 'Frontend'
$backendPath = Join-Path $RepoPath 'Backend'

if (-not (Test-Path $NodeExecutable)) {
    throw "Executável do npm não encontrado em '$NodeExecutable'. Informe o caminho correto usando -NodeExecutable."
}

if (-not (Test-Path $frontendPath)) {
    throw "Diretório do front-end não encontrado em '$frontendPath'."
}

if (-not (Test-Path $backendPath)) {
    throw "Diretório da API não encontrado em '$backendPath'."
}

Write-Host "Instalando dependências do front-end em $frontendPath" -ForegroundColor Cyan
& $NodeExecutable install --prefix $frontendPath
if ($LASTEXITCODE -ne 0) {
    throw "npm install falhou para o front-end."
}

Write-Host "Instalando dependências da API em $backendPath" -ForegroundColor Cyan
& $NodeExecutable install --prefix $backendPath
if ($LASTEXITCODE -ne 0) {
    throw "npm install falhou para a API."
}

function Copy-DotEnvFile {
    param (
        [string]$Source,
        [string]$Target
    )

    if (-not (Test-Path $Source)) {
        Write-Warning "Arquivo de exemplo não encontrado: $Source"
        return
    }

    if (Test-Path $Target) {
        Write-Host "Arquivo $Target já existe. Mantendo arquivo atual." -ForegroundColor Yellow
        return
    }

    Write-Host "Copiando $Source para $Target" -ForegroundColor Green
    Copy-Item -Path $Source -Destination $Target
}

Copy-DotEnvFile -Source (Join-Path $frontendPath '.env.example') -Target (Join-Path $frontendPath '.env')
Copy-DotEnvFile -Source (Join-Path $backendPath '.env.example') -Target (Join-Path $backendPath '.env')

Write-Host "Dependências instaladas com sucesso." -ForegroundColor Green
