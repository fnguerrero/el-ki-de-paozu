@echo off
REM Levanta el juego y lo abre en el navegador.
REM Usa tools\servidor.py, que sirve sin cache: si no, el navegador se queda
REM con una version vieja del index y los archivos nuevos no cargan.
title Dragon Ball - El Ki de Paozu
cd /d "%~dp0"
start "" http://localhost:8134
python tools\servidor.py 8134
