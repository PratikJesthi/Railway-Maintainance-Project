from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import audit, blocks, bootstrap, conflicts, feed, kpis, meta, queue, reports, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    description="Backend for the SANCHALAN Automatic Block Planning dashboard.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meta.router)
app.include_router(blocks.router)
app.include_router(queue.router)
app.include_router(feed.router)
app.include_router(audit.router)
app.include_router(kpis.router)
app.include_router(reports.router)
app.include_router(conflicts.router)
app.include_router(bootstrap.router)
app.include_router(ws.router)


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
