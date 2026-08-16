# ============================================================
#  start-dashboard.ps1
#  一鍵啟動：夸克搜索儀表板（後端 + 儀表板）
#
#  用法（在 PowerShell 中）：
#     Set-ExecutionPolicy -Scope Process Bypass   # 若遇權限限制
#     powershell -ExecutionPolicy Bypass -File .\start-dashboard.ps1
# ============================================================

$ErrorActionPreference = "Stop"

# ---------- 可調參數 ----------
$ProjectDir = Join-Path $PSScriptRoot "panhub.shenzjd.com"   # Nuxt 專案根目錄（相對於腳本所在）
$DashboardPort = 8080                            # 儀表板埠號
$HealthUrl   = "http://localhost:4000/api/health" # 後端健康檢查（見下方說明）
$PluginTimeoutMs = "60000"                        # 單次搜索超時（本機建議 60000）
# ------------------------------

Write-Host ""
Write-Host "================ 夸克儀表板 一鍵啟動 ================" -ForegroundColor Cyan
Write-Host " 專案目錄 : $ProjectDir"
Write-Host " 儀表板   : http://localhost:$DashboardPort"
Write-Host ""

# ---------- 1. 啟動後端 (npm run dev) ----------
Write-Host "[1/2] 正在啟動後端 (npm run dev) ..." -ForegroundColor Yellow
$backend = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "cd /d `"$ProjectDir`" && npm run dev" `
    -WorkingDirectory $ProjectDir `
    -PassThru `
    -RedirectStandardOutput "$PSScriptRoot\.backend.log" `
    -RedirectStandardError "$PSScriptRoot\.backend.err.log" `
    -WindowStyle Minimized
Write-Host "      後端進程 PID = $($backend.Id)（日誌：.backend.log）"

# ---------- 2. 等待後端就緒 ----------
Write-Host "[*] 等待後端就緒 ..." -ForegroundColor Gray
$ready = $false
for ($i = 1; $i -le 60; $i++) {
    Start-Sleep -Seconds 1
    try {
        # 改用 TCP 連接測試（比 HTTP 探測更穩定，避免端口未開時拋異常打斷腳本）
        $client = New-Object System.Net.Sockets.TcpClient
        $async = $client.BeginConnect("127.0.0.1", 4000, $null, $null)
        if ($async.AsyncWaitHandle.WaitOne(500)) {
            $client.EndConnect($async)
            $ready = $true
        }
        $client.Close()
    } catch { }
    if ($ready) { break }
    if ($i % 5 -eq 0) { Write-Host "      ...等待中 ($i s)" -ForegroundColor Gray }
}
if (-not $ready) {
    Write-Host "後端未在 60 秒內就緒，請檢查 .backend.log。仍嘗試啟動儀表板 ..." -ForegroundColor Red
} else {
    Write-Host "      後端已就緒（本機連接 127.0.0.1:4000 成功）。" -ForegroundColor Green
}

# ---------- 3. 啟動儀表板 ----------
Write-Host "[2/2] 正在啟動儀表板 (run-quark-dashboard.mjs) ..." -ForegroundColor Yellow
$env:PLUGIN_TIMEOUT_MS = $PluginTimeoutMs

# 儀表板是常駐進程，在前景執行，藉由 npm/node 啟動
Write-Host "      儀表板位址：http://localhost:$DashboardPort" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "  啟動完成！請在瀏覽器開啟 http://localhost:$DashboardPort"
Write-Host "  停止方式：對 後端視窗 / 本視窗 按 Ctrl+C（或關閉此 PowerShell 視窗）"
Write-Host "==============================================================" -ForegroundColor Cyan

Push-Location $ProjectDir
try {
    node scripts/run-quark-dashboard.mjs
} finally {
    Pop-Location
}
