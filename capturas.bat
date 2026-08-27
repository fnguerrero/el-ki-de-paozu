@echo off
REM Servidor de capturas: deja esta ventana abierta y Claude puede ver el juego.
title Dragon Ball - capturas
cd /d "%~dp0"
python tools\servidor_capturas.py
