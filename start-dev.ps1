[CmdletBinding()]
param (
    [string]$NodeExecutable = "C:\Program Files\nodejs\npm.cmd",
    [string]$RepoPath,
    [switch]$ApiOnly,
    [switch]$WebOnly
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

if ($ApiOnly -and $WebOnly) {
    throw "Use apenas um dos switches -ApiOnly ou -WebOnly, ou nenhum para iniciar ambos."
}

function Start-NpmWindow {
    param (
        [string]$WorkingDirectory,
        [string]$CommandName
    )

    $escapedNode = $NodeExecutable.Replace("'", "''")
    $command = "Set-Location '$WorkingDirectory'; & '$escapedNode' run $CommandName"
    Start-Process -FilePath 'pwsh' -ArgumentList '-NoExit', '-Command', $command -WorkingDirectory $WorkingDirectory | Out-Null
}

if (-not $WebOnly) {
    Write-Host "Abrindo janela para API (Backend)" -ForegroundColor Cyan
    Start-NpmWindow -WorkingDirectory $backendPath -CommandName 'dev'
}

if (-not $ApiOnly) {
    Write-Host "Abrindo janela para front-end (Frontend)" -ForegroundColor Cyan
    Start-NpmWindow -WorkingDirectory $frontendPath -CommandName 'dev'
}

Write-Host "Processos iniciados. Feche as janelas abertas para encerrar os servidores." -ForegroundColor Green
