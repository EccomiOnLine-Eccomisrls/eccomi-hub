"""ECCOMI HUB backend package."""

from .auth_guard import install_auth_guard
from .team_routes import install_team_routes

# Install patches before importing preview_cors: preview_cors imports app.main,
# which creates the FastAPI instance. The team routes must therefore already
# be registered on FastAPI.__init__ before app.main is loaded.
install_auth_guard()
install_team_routes()

from .preview_cors import install_preview_cors

install_preview_cors()
