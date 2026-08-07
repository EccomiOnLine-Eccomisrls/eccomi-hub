"""ECCOMI HUB backend package."""

from .auth_guard import install_auth_guard
from .team_routes import install_team_routes

install_auth_guard()
install_team_routes()
