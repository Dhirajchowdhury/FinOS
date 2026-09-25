from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.session import engine, Base
from app.api.auth import router as auth_router
from app.api.analysis import router as analysis_router

# Ensure models are imported so SQLAlchemy metadata registers them
import app.models.user
import app.models.otp

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on application startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Institutional-grade authentication service and 10-agent financial intelligence system for FinOS.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration for secure frontend-backend communication
allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# De-duplicate
allowed_origins = list(set(allowed_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Authentication & Analysis Routers
app.include_router(auth_router)
app.include_router(analysis_router)

@app.get("/", tags=["System"])
def root():
    return {
        "system": "FinOS Authentication Gateway",
        "status": "operational",
        "version": settings.VERSION,
        "docs": "/docs",
    }

@app.get("/health", tags=["System"])
def health():
    return {"status": "healthy"}
