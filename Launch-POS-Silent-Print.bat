@echo off
title The Royal Palette POS - Silent Auto Print
echo ========================================================
echo   The Royal Palette - POS Terminal (Silent Print Mode)
echo ========================================================
echo.
echo Launching Google Chrome / Microsoft Edge with Kiosk Printing...
echo Printing dialogs are bypassed automatically.
echo Receipts will print silently to your default printer (Rongta RP335).
echo.

set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
set CHROME_PATH_X86="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
set EDGE_PATH="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

if exist %CHROME_PATH% (
    start "" %CHROME_PATH% --kiosk-printing --app=http://localhost:3002/pos
    exit
)

if exist %CHROME_PATH_X86% (
    start "" %CHROME_PATH_X86% --kiosk-printing --app=http://localhost:3002/pos
    exit
)

if exist %EDGE_PATH% (
    start "" %EDGE_PATH% --kiosk-printing --app=http://localhost:3002/pos
    exit
)

echo Browser not found in standard paths. Opening default browser...
start http://localhost:3002/pos
