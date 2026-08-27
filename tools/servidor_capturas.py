# -*- coding: utf-8 -*-
"""Servidor chico que recibe capturas del juego y las guarda como PNG.

Existe porque el panel del navegador no siempre esta visible, y sin el los
screenshots fallan. Con esto el propio juego manda lo que dibuja y queda un
archivo en disco que se puede mirar.

Desde la consola del navegador:

    Test.capturar('charla')      // guarda .nonstop/capturas/charla.png

Correrlo:

    python tools/servidor_capturas.py
"""
import base64
import io
import json
import os
import sys

try:
    from http.server import BaseHTTPRequestHandler, HTTPServer
except ImportError:
    from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer

PUERTO = 8135
SALIDA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                      '.nonstop', 'capturas')


class Manejador(BaseHTTPRequestHandler):

    def _cors(self):
        # El juego corre en 8134 y esto en 8135: sin CORS el fetch no sale.
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_POST(self):
        largo = int(self.headers.get('Content-Length', 0))
        crudo = self.rfile.read(largo)
        try:
            datos = json.loads(crudo.decode('utf-8'))
            nombre = ''.join(c for c in datos.get('nombre', 'captura')
                             if c.isalnum() or c in '-_')
            b64 = datos['png'].split(',')[-1]
            if not os.path.isdir(SALIDA):
                os.makedirs(SALIDA)
            ruta = os.path.join(SALIDA, nombre + '.png')
            with open(ruta, 'wb') as f:
                f.write(base64.b64decode(b64))
            respuesta = {'ok': True, 'ruta': ruta}
            print('guardada: %s' % ruta)
        except Exception as e:
            respuesta = {'ok': False, 'error': str(e)}
            print('error: %s' % e)

        cuerpo = json.dumps(respuesta).encode('utf-8')
        self.send_response(200)
        self._cors()
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def log_message(self, *args):
        pass   # sin ruido en la consola


if __name__ == '__main__':
    if not os.path.isdir(SALIDA):
        os.makedirs(SALIDA)
    print('servidor de capturas en http://localhost:%d  ->  %s' % (PUERTO, SALIDA))
    HTTPServer(('127.0.0.1', PUERTO), Manejador).serve_forever()
