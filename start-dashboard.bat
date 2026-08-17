@echo off
chcp 65001 >nul
title 夸克儀表板 一鍵啟動
echo ========================================
echo  夸克儀表板 一鍵啟動
echo  後端: http://localhost:4000
echo  儀表板: http://localhost:8080
echo =========================================
echo [1/2] 啟動後端 (npm run dev) ...
start "夸克後端" /MIN cmd /c "cd /d %~dp0panhub.shenzjd.com && npm run dev"
echo       後端已啟動（最小化視窗）
echo.
echo [*] 等待後端就緒...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; for($i=1;$i -le 60;$i++){ Start-Sleep -Seconds 1; try{ $t=New-Object System.Net.Sockets.TcpClient; $a=$t.BeginConnect('127.0.0.1',4000,$null,$null); if($a.AsyncWaitHandle.WaitOne(800)){ $t.EndConnect($a); $ok=$true }; $t.Close() }catch{} if($ok){break} }; if($ok){exit 0}else{exit 1}"
if errorlevel 1 (
    echo       後端未在 60 秒內就緒，仍嘗試啟動儀表板...
) else (
    echo       後端就緒。
)
echo.
echo [2/2] 啟動儀表板...
echo       儀表板位址: http://localhost:8080
echo ==========================================
echo   啟動完成！請在瀏覽器開啟 http://localhost:8080
echo   停止方式：關閉這兩個視窗即可
echo ==========================================
echo.
cd /d %~dp0panhub.shenzjd.com
set PLUGIN_TIMEOUT_MS=60000
node scripts\run-quark-dashboard.mjs
pause