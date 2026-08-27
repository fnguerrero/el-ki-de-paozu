# -*- coding: utf-8 -*-
"""Servidor del juego, sin cache.

`python -m http.server` deja que el navegador cachee el index.html, y entonces
al agregar un archivo nuevo al juego la pagina sigue cargando la lista vieja de
scripts: el archivo nuevo nunca aparece y todo falla con "X is not defined".

Este manda Cache-Control: no-store en todo, asi siempre se sirve lo ultimo.

    python tools/servidor.py            -> puerto 8134
    python tools/servidor.py 9000       -> otro puerto
"""
import os
import sys

try:
    from http.server import SimpleHTTPRequestHandler, HTTPServer
except ImportError:
    from SimpleHTTPServer import SimpleHTTPRequestHandler
    from BaseHTTPServer import HTTPServer

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUERTO = int(sys.argv[1]) if len(sys.argv) > 1 else 8134


class SinCache(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        try:
            SimpleHTTPRequestHandler.__init__(self, *args, directory=RAIZ, **kwargs)
        except TypeError:
            # Python viejo: no acepta `directory`
            os.chdir(RAIZ)
            SimpleHTTPRequestHandler.__init__(self, *args, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        SimpleHTTPRequestHandler.end_headers(self)

    def log_message(self, formato, *args):
        # Solo los errores: el log de cada .js es ruido
        if args and len(args) > 1 and str(args[1]).startswith(('4', '5')):
            sys.stderr.write('%s %s\n' % (args[0], args[1]))


if __name__ == '__main__':
    print('Dragon Ball - El Ki de Paozu')
    print('  http://localhost:%d' % PUERTO)
    print('  sirviendo %s (sin cache)' % RAIZ)
    print('  cerra esta ventana para apagar el servidor')
    try:
        HTTPServer(('', PUERTO), SinCache).serve_forever()
    except KeyboardInterrupt:
        print('\nservidor apagado')
