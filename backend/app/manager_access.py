from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import FastAPI, Header, HTTPException, status
from pydantic import BaseModel, EmailStr


SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()
SUPABASE_SERVICE_ROLE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    or os.getenv("SUPABASE_SERVICE_KEY", "")
).strip()


class CurrentHubProfile(BaseModel):
    user_id: str
    ec_id: str
    email: EmailStr
    full_name: str
    role: str
    ecosystem_keys: list[str]
    active: bool


def _service_headers() -> dict[str, str]:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Profilo HUB non disponibile: configurazione Supabase incompleta.",
        )
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


async def current_hub_profile(
    authorization: str | None = Header(default=None),
) -> CurrentHubProfile:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Sessione mancante.")

    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Sessione mancante.")

    async with httpx.AsyncClient(timeout=12.0) as client:
        auth_response = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {token}",
            },
        )

        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Sessione scaduta o non valida.")

        auth_user: dict[str, Any] = auth_response.json()
        user_id = str(auth_user.get("id") or "")

        profile_response = await client.get(
            f"{SUPABASE_URL}/rest/v1/hub_profiles",
            headers=_service_headers(),
            params={
                "user_id": f"eq.{user_id}",
                "active": "eq.true",
                "select": "user_id,ec_id,email,full_name,role,ecosystem_keys,active",
                "limit": "1",
            },
        )

    if profile_response.status_code != 200:
        raise HTTPException(status_code=502, detail="Non è stato possibile leggere il profilo HUB.")

    rows = profile_response.json()
    if not rows:
        raise HTTPException(status_code=403, detail="Utente non abilitato a ECCOMI HUB.")

    return CurrentHubProfile(**rows[0])


def install_manager_access_routes(app: FastAPI) -> None:
    existing_paths = {route.path for route in app.routes}
    if "/v1/team/me" in existing_paths:
        return

    app.add_api_route(
        "/v1/team/me",
        current_hub_profile,
        methods=["GET"],
        response_model=CurrentHubProfile,
        tags=["team"],
    )
