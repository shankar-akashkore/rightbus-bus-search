"""Every API error is returned in one shape: {"error": {"code", "message", "details"}}."""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("rightbus.errors")


class AppError(Exception):
    status_code = 500
    code = "INTERNAL_ERROR"
    message = "Something went wrong on our side."

    def __init__(
        self,
        message: str | None = None,
        *,
        details: list[dict] | None = None,
        reason: str | None = None,
    ):
        self.message = message or self.message
        self.details = details or []
        self.reason = reason  # internal detail for the logs, never sent to clients
        super().__init__(reason or self.message)


class InvalidSearchError(AppError):
    status_code = 422
    code = "VALIDATION_ERROR"
    message = "The search request is invalid."


class GdsUnavailableError(AppError):
    status_code = 502
    code = "GDS_UNAVAILABLE"
    message = "Our bus inventory provider is unreachable right now. Please try again shortly."


class GdsTimeoutError(AppError):
    status_code = 504
    code = "GDS_TIMEOUT"
    message = "Our bus inventory provider took too long to respond. Please try again."


class GdsBadResponseError(AppError):
    status_code = 502
    code = "GDS_BAD_RESPONSE"
    message = "Our bus inventory provider sent an unexpected response. Please try again."


def error_body(code: str, message: str, details: list[dict] | None = None) -> dict:
    return {"error": {"code": code, "message": message, "details": details or []}}


def friendly_detail(error: dict) -> dict:
    """Turn one Pydantic error into a {"field", "message"} pair a person can read."""
    location = [str(part) for part in error.get("loc", ()) if part not in ("query", "path", "body")]
    field = ".".join(location) or None
    if field and error.get("type") in {"missing", "string_too_short"}:
        message = f"{field} is required"
    else:
        message = str(error.get("msg", "Invalid value")).removeprefix("Value error, ")
    return {"field": field, "message": message}


async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
    if exc.status_code >= 500:
        logger.warning("%s on %s: %s", exc.code, request.url.path, exc.reason or exc.message)
    return JSONResponse(
        status_code=exc.status_code, content=error_body(exc.code, exc.message, exc.details)
    )


async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    details = [friendly_detail(error) for error in exc.errors()]
    message = details[0]["message"] if details else "The request is invalid."
    return JSONResponse(status_code=422, content=error_body("VALIDATION_ERROR", message, details))


async def handle_http_error(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    code = {404: "NOT_FOUND", 405: "METHOD_NOT_ALLOWED"}.get(exc.status_code, "HTTP_ERROR")
    return JSONResponse(
        status_code=exc.status_code, content=error_body(code, str(exc.detail)), headers=exc.headers
    )


async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(status_code=500, content=error_body(AppError.code, AppError.message))


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, handle_app_error)
    app.add_exception_handler(RequestValidationError, handle_validation_error)
    app.add_exception_handler(StarletteHTTPException, handle_http_error)
    app.add_exception_handler(Exception, handle_unexpected_error)
