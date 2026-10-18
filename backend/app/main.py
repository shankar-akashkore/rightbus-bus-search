import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.errors import register_error_handlers
from app.gds_client import GdsClient
from app.routes import router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    # One client for the app's whole life, so connections to the GDS are reused.
    async with httpx.AsyncClient(
        base_url=settings.gds_base_url, timeout=settings.gds_timeout_seconds
    ) as http:
        app.state.gds_client = GdsClient(http)
        yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="RightBus Bus Search API", version="1.0.0", lifespan=lifespan)
    # Only needed for a frontend on another origin; in dev the Vite proxy keeps calls same-origin.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["GET"],
        allow_headers=["*"],
    )
    register_error_handlers(app)
    app.include_router(router)
    return app


app = create_app()
