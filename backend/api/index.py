import sys
import os
import traceback

curr = os.path.dirname(os.path.abspath(__file__))
parent = os.path.dirname(curr)
grandparent = os.path.dirname(parent)

for p in [curr, parent, grandparent, os.path.join(parent, "backend"), os.path.join(parent, "app"), os.path.join(parent, "api", "app"), os.path.join(grandparent, "backend")]:
    if p and os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.main import app
except Exception as e:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    from fastapi.middleware.cors import CORSMiddleware
    
    app = FastAPI(title="Staflo Startup Diagnostic")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    err_trace = f"{type(e).__name__}: {str(e)}\n\n{traceback.format_exc()}"
    print(f"[FATAL STARTUP ERROR] {err_trace}", file=sys.stderr)

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def diagnostic_handler(full_path: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Backend Startup Exception",
                "message": str(e),
                "traceback": err_trace
            }
        )

handler = app
app = app
