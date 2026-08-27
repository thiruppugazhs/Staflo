import sys
import os

curr = os.path.dirname(os.path.abspath(__file__))
parent = os.path.dirname(curr)
grandparent = os.path.dirname(parent)

for p in [curr, parent, grandparent, os.path.join(parent, "backend"), os.path.join(parent, "app"), os.path.join(parent, "api", "app"), os.path.join(grandparent, "backend")]:
    if p and os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.main import app
except ImportError:
    try:
        from backend.app.main import app
    except ImportError:
        try:
            from api.app.main import app
        except ImportError:
            from main import app

handler = app
app = app
