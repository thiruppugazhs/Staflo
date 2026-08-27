import sys
import os

# Add the backend directory and backend/app to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.insert(0, backend_dir)
sys.path.insert(0, os.path.join(backend_dir, "app"))

from app.main import app

handler = app
app = app
