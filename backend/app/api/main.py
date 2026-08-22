from fastapi import APIRouter

from app.api.routes import clients, login, packages, payments, private, users, utils
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(clients.router)
api_router.include_router(packages.router)
api_router.include_router(payments.router)


if settings.FASTAPI_ENV == "development":
    api_router.include_router(private.router)
