import sys
import os

# Add the backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
if os.path.exists(backend_dir):
    sys.path.insert(0, os.path.abspath(backend_dir))

# Also add backend/app
app_dir = os.path.join(backend_dir, "app")
if os.path.exists(app_dir):
    sys.path.insert(0, os.path.abspath(app_dir))

from app.main import app

# Export for Vercel serverless function
handler = app
app = app
