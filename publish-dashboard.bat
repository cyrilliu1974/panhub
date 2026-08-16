@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================================
::  publish-dashboard.bat
::  一鍵發佈 dashboard 修改（submodule 流程）
::
::  關鍵順序：先推 submodule (panhub.shenzjd.com) → 再更新根倉庫指針
::  只推根倉庫是沒用的：別人 clone 仍拿到舊版。
::
::  用法：
::      publish-dashboard.bat              使用預設提交訊息
::      publish-dashboard.bat 修正XX邏輯   自訂 submodule 提交訊息
:: ============================================================

:: 根倉庫 = 腳本所在目錄；submodule = 其下 panhub.shenzjd.com
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "SUB=%ROOT%\panhub.shenzjd.com"

title 一鍵發佈 dashboard (submodule)
echo ========================================
echo  一鍵發佈 dashboard 修改
echo  根倉庫 : %ROOT%
echo  submodule: %SUB%
echo ========================================

:: ---------- 1. submodule 內提交並推送 ----------
echo.
echo [1/2] 處理 submodule (panhub.shenzjd.com) ...
cd /d "%SUB%" || (echo   找不到 %SUB%，中止。 & pause & exit /b 1)

git add -A
git diff --cached --quiet
if %errorlevel%==0 (
    echo       無程式碼變更，跳過 submodule 提交。
) else (
    set "MSG=%~1"
    if "%MSG%"=="" set "MSG=chore: update dashboard (submodule)"
    git commit -m "%MSG%"
    if errorlevel 1 (
        echo       submodule 提交失敗，中止。
        pause
        exit /b 1
    )
    echo       已提交 submodule：%MSG%
)

echo       推送 submodule 至 origin/main ...
git push origin main
if errorlevel 1 (
    echo       submodule push 失敗（請檢查憑證/網路），中止。
    echo       根倉庫指針尚未更新，別人仍可拿到舊版，請解決後重跑本腳本。
    pause
    exit /b 1
)
echo       submodule 已推送到遠端。

:: ---------- 2. 根倉庫更新 submodule 指針並推送 ----------
echo.
echo [2/2] 更新根倉庫 submodule 指針 ...
cd /d "%ROOT%"
git add panhub.shenzjd.com
git diff --cached --quiet
if %errorlevel%==0 (
    echo       根倉庫 submodule 指針無變化，無需提交。
) else (
    git commit -m "chore: bump submodule panhub.shenzjd.com"
    if errorlevel 1 (
        echo       根倉庫提交失敗，中止。
        pause
        exit /b 1
    )
    echo       已提交根倉庫：更新 submodule 指針。
    git push origin main
    if errorlevel 1 (
        echo       根倉庫 push 失敗（請檢查憑證/網路）。
        echo       注意：submodule 已成功推送，但根倉庫指針更新尚未上傳，
        echo       請手動執行  git push origin main  完成發佈。
        pause
        exit /b 1
    )
    echo       根倉庫已推送到遠端。
)

echo.
echo ========================================
echo   發佈完成！別人 clone --recurse-submodules 即可取得新版 dashboard。
echo ========================================
echo.
pause
