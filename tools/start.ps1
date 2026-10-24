param([switch]$NoOpen)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path

function Test-OpenPort([int]$port) {
    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $attempt = $client.ConnectAsync('127.0.0.1', $port)
        return $attempt.Wait(300) -and $client.Connected
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

function Test-GameServer([int]$port) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$port/" -TimeoutSec 3 -UseBasicParsing
        return $response.StatusCode -eq 200 -and $response.Content.Contains('id="kk-root"')
    } catch {
        return $false
    }
}

$port = $null
foreach ($candidate in 8765..8775) {
    if (Test-GameServer $candidate) { $port = $candidate; break }
    if (-not (Test-OpenPort $candidate)) { $port = $candidate; break }
}
if ($null -eq $port) { throw 'Local ports 8765-8775 are in use.' }

if (-not (Test-GameServer $port)) {
    $python = Get-Command python.exe -ErrorAction SilentlyContinue
    if (-not $python) { throw 'Python is required to start the local game server.' }
    $server = Join-Path $projectRoot 'tools\serve.py'
    $process = Start-Process -FilePath $python.Source -ArgumentList @('"' + $server + '"', $port) `
        -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
        if (Test-GameServer $port) { $ready = $true; break }
        if ($process.HasExited) { break }
        Start-Sleep -Milliseconds 250
    }
    if (-not $ready) { throw "Game server did not start on port $port." }
}

$gameUrl = "http://127.0.0.1:$port/"
Write-Host "Paper Kart is ready: $gameUrl"
if (-not $NoOpen) { Start-Process -FilePath $gameUrl }
