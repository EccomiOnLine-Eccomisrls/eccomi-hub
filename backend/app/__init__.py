"""ECCOMI HUB backend package."""

from .auth_guard import install_auth_guard
from .team_routes import install_team_routes
from .preview_cors import install_preview_cors

install_auth_guard()
install_team_routes()
install_preview_cors()
