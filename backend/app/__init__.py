"""ECCOMI HUB backend package."""

from .auth_guard import install_auth_guard
from .team_routes import install_team_routes
from .team_safety_patch import install_team_safety_patch

# Install patches before importing preview_cors: preview_cors imports app.main,
# which creates the FastAPI instance. The team routes must therefore already
# be registered on FastAPI.__init__ before app.main is loaded.
install_auth_guard()
install_team_routes()
install_team_safety_patch()

from .preview_cors import install_preview_cors
from .manager_access import install_manager_access_routes
from .noleggio_sso import install_noleggio_sso_routes
from .performance_connector import install_performance_connector_routes
from .main import app

install_manager_access_routes(app)
install_noleggio_sso_routes(app)
install_performance_connector_routes(app)
install_preview_cors()
