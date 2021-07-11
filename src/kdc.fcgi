#!/usr/bin/env python

# # Enter the virtualenv
# import os.path
# _activate = os.path.join(os.path.dirname(__file__),
#                          '../../env/bin/activate_this.py')
# execfile(_activate, dict(__file__=_activate))

# Add the kdc to the path
import os.path
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '../kdc'))

from flup.server.fcgi import WSGIServer
from kdc import create_app

if __name__ == '__main__':
    app = create_app()
    WSGIServer(app).run()
