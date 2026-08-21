@echo off
chcp 65001 >nul
title ADSPY - spy de publicites Meta
cd /d "%~dp0.."

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js n'est pas installe sur cet ordinateur.
  echo.
  echo   1. Va sur https://nodejs.org
  echo   2. Telecharge la version LTS et installe-la
  echo   3. Relance ce fichier
  echo.
  pause
  exit /b 1
)

echo.
echo   Demarrage d'ADSPY... la page s'ouvre toute seule.
echo   Laisse cette fenetre ouverte tant que tu utilises l'outil.
echo   Ferme-la ^(ou Ctrl+C^) pour arreter.
echo.

start "" http://localhost:4177
node adspy\server.js

echo.
echo   ADSPY s'est arrete.
pause
