import sys
import os

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

app_dir = os.path.join(backend_dir, "app")
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from app.main import app

handler = app
app = app
