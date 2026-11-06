@echo off
rem ECO-EXPERT.AI presentation: one click to build the latest version and open it.
rem Needs Node.js (https://nodejs.org) and an internet connection for the satellite maps.
cd /d "%~dp0"

if not exist node_modules (
  echo Installing dependencies, first run only...
  call npm install --no-audit --no-fund || goto :error
)

echo Building the presentation...
call npm run build || goto :error

echo.
echo Opening the presentation in your browser.
echo   Next: Right arrow, Space, Page Down, clicker or left click
echo   Back: Left arrow, Page Up or right click
echo   Full screen: F      First / last step: Home / End
echo Close this window to stop.
echo.
call npx vite preview --port 4175 --strictPort --open
goto :eof

:error
echo.
echo Something went wrong. See the messages above.
pause
