from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uuid

from core.config import settings
from core.database import init_db
from core.neo4j import close_neo4j
from core.auth import hash_password, verify_password, create_access_token
from api.routes.routes import router
from schemas.schemas import LoginRequest, TokenResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_neo4j()


app = FastAPI(
    title="Vanguard OSINT API",
    description=(
        "Lawful social media intelligence and digital forensics platform. "
        "All analysis outputs are investigative leads only."
    ),
    version="0.9.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all case/analysis routes under /api/v1
app.include_router(router, prefix="/api/v1")


# ─── Auth Routes ──────────────────────────────────────────────────────────────

@app.post("/auth/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    """
    Demo login — in production connect to User table.
    For the prototype, any credentials work.
    """
    # TODO: replace with real DB lookup
    if not body.email or not body.password:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Email and password required")

    token = create_access_token(data={
        "sub": str(uuid.uuid4()),
        "email": body.email,
    })
    return TokenResponse(access_token=token)


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "env": settings.app_env,
        "version": "0.9.0",
    }


@app.get("/")
async def root():
    return {
        "name": "Vanguard OSINT API",
        "docs": "/docs",
        "health": "/health",
        "disclaimer": (
            "This platform is for lawful investigative use only. "
            "All outputs are investigative leads, not conclusions."
        ),
    }
