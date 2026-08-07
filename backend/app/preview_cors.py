from fastapi.middleware.cors import CORSMiddleware

from .main import app


def install_preview_cors() -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https://eccomi-hub-frontend-pr-\d+\.onrender\.com",
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )
