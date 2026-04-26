import logging
import re

from fastapi import FastAPI, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes import agent_proxy, agents, auth_routes, chat, events, experiments, inventory, projects, supervision, usage, users

_log = logging.getLogger("uvicorn.error")

app = FastAPI(title="Sandy Lab API", version="0.1.0")

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list(),
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_LOCAL_ORIGIN_RE = re.compile(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$")


@app.middleware("http")
async def _local_dev_cors_fallback(request: Request, call_next):
    """Fallback CORS handler for local dev ports when browser preflight is strict."""
    origin = request.headers.get("origin", "")
    if request.method == "OPTIONS" and origin and _LOCAL_ORIGIN_RE.match(origin):
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
                "Access-Control-Allow-Headers": request.headers.get(
                    "access-control-request-headers",
                    "authorization,content-type",
                ),
                "Vary": "Origin",
            },
        )
    response = await call_next(request)
    if origin and _LOCAL_ORIGIN_RE.match(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        vary = response.headers.get("Vary")
        response.headers["Vary"] = "Origin" if not vary else f"{vary}, Origin"
    return response


@app.on_event("startup")
async def _log_auth_mode() -> None:
    s = get_settings()
    if s.skip_auth:
        _log.warning(
            "SKIP_AUTH is enabled: API accepts unauthenticated requests as the first DB user. "
            "Set SKIP_AUTH=false before production.",
        )


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth_routes.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(experiments.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
app.include_router(supervision.router, prefix="/api")
app.include_router(usage.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(agent_proxy.router, prefix="/api")
