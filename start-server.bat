@echo off
title RMIT PromptSync - Dev Server
cd /d "%~dp0"

echo ============================================
echo   RMIT PromptSync - local dev server
echo ============================================
echo.

if not exist node_modules (
    echo [setup] node_modules missing - installing dependencies...
    call npm install
    echo.
)

if not exist .env.local (
    echo  ############################################################
    echo  #  WARNING: .env.local not found!                          #
    echo  #  Firebase is NOT configured - the app will show a        #
    echo  #  warning banner and sessions won't work.                 #
    echo  #  Copy .env.local.example to .env.local and fill it in.   #
    echo  ############################################################
    echo.
)

echo  Host panel (this PC):   http://localhost:3000/host
echo.
echo  Phone display (same Wi-Fi, pick the address on your LAN):
powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | ForEach-Object { '    http://' + $_.IPAddress + ':3000/display' }"
echo.
echo  If the phone can't reach it, allow Node.js through Windows
echo  Firewall (private networks) when prompted, and make sure both
echo  devices are on the same Wi-Fi network.
echo.
echo  Press Ctrl+C to stop the server.
echo ============================================
echo.

call npm run dev:lan
pause
