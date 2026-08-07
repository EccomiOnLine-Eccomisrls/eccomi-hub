from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import FastAPI, Header, HTTPException, status
from pydantic import BaseModel, EmailStr, Field


SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()
SUPABASE_SERVICE_ROLE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    or os.getenv("SUPABASE_SERVICE_KEY", "")
).strip()

_original_fastapi_init = FastAPI.__init__
_installed = False


class ResponsibleInput(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    ecosystem_key: str = Field(pattern=r"^[a-z0-9_-]+$")


class ResponsibleProfile(BaseModel):
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
            detail="Gestione responsabili non configurata: manca la Service Role Key.",
        )
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


async def _require_ceo(authorization: str | None) -> dict[str, Any]:
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

        user = auth_response.json()
        user_id = str(user.get("id") or "")
        profile_response = await client.get(
            f"{SUPABASE_URL}/rest/v1/hub_profiles",
            headers=_service_headers(),
            params={
                "user_id": f"eq.{user_id}",
                "role": "eq.ceo",
                "active": "eq.true",
                "select": "user_id,email,role",
                "limit": "1",
            },
        )

    if profile_response.status_code != 200 or not profile_response.json():
        raise HTTPException(status_code=403, detail="Operazione riservata al CEO.")
    return user


async def _find_or_create_auth_user(email: str) -> str:
    headers = _service_headers()
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers=headers,
            params={"page": "1", "per_page": "1000"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="Non è stato possibile leggere gli utenti HUB.")

        payload = response.json()
        users = payload.get("users", payload if isinstance(payload, list) else [])
        for user in users:
            if str(user.get("email") or "").strip().lower() == email:
                return str(user.get("id") or "")

        create_response = await client.post(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers=headers,
            json={"email": email, "email_confirm": True},
        )
        if create_response.status_code not in (200, 201):
            detail = create_response.text[:300]
            raise HTTPException(
                status_code=502,
                detail=f"Non è stato possibile creare l'identità HUB: {detail}",
            )
        return str(create_response.json().get("id") or "")


def _ecosystem_code(ecosystem_key: str) -> str:
    codes = {
        "noleggio": "NOL",
        "posta": "POS",
        "energia": "ENE",
        "spedizioni": "SPE",
        "pec": "PEC",
    }
    return codes.get(ecosystem_key, ecosystem_key[:3].upper())


async def _list_responsibles() -> list[ResponsibleProfile]:
    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/hub_profiles",
            headers=_service_headers(),
            params={
                "role": "eq.manager",
                "select": "user_id,ec_id,email,full_name,role,ecosystem_keys,active",
                "order": "created_at.asc",
            },
        )
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Non è stato possibile leggere i responsabili.")
    return [ResponsibleProfile(**row) for row in response.json()]


async def list_responsibles(
    authorization: str | None = Header(default=None),
) -> list[ResponsibleProfile]:
    await _require_ceo(authorization)
    return await _list_responsibles()


async def create_responsible(
    body: ResponsibleInput,
    authorization: str | None = Header(default=None),
) -> ResponsibleProfile:
    await _require_ceo(authorization)
    email = str(body.email).strip().lower()
    full_name = body.full_name.strip()
    ecosystem_key = body.ecosystem_key.strip().lower()

    user_id = await _find_or_create_auth_user(email)
    if not user_id:
        raise HTTPException(status_code=502, detail="Identità HUB non disponibile.")

    current = await _list_responsibles()
    existing = next((item for item in current if item.user_id == user_id), None)
    ec_id = existing.ec_id if existing else f"EC-MGR-{_ecosystem_code(ecosystem_key)}-{len(current) + 1:04d}"

    row = {
        "user_id": user_id,
        "ec_id": ec_id,
        "email": email,
        "full_name": full_name,
        "role": "manager",
        "ecosystem_keys": [ecosystem_key],
        "active": True,
    }

    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/hub_profiles",
            headers={
                **_service_headers(),
                "Prefer": "resolution=merge-duplicates,return=representation",
            },
            params={"on_conflict": "user_id"},
            json=row,
        )

    if response.status_code not in (200, 201):
        if response.status_code in (401, 403):
            raise HTTPException(
                status_code=503,
                detail=(
                    "La Service Role non può ancora scrivere in hub_profiles. "
                    "Concedi INSERT e UPDATE alla tabella e riprova."
                ),
            )
        raise HTTPException(status_code=502, detail=f"Salvataggio responsabile non riuscito: {response.text[:300]}")

    payload = response.json()
    saved = payload[0] if isinstance(payload, list) and payload else row
    return ResponsibleProfile(**saved)


def _install_routes(app: FastAPI) -> None:
    app.add_api_route(
        "/v1/team/responsibles",
        list_responsibles,
        methods=["GET"],
        response_model=list[ResponsibleProfile],
        tags=["team"],
    )
    app.add_api_route(
        "/v1/team/responsibles",
        create_responsible,
        methods=["POST"],
        response_model=ResponsibleProfile,
        status_code=status.HTTP_201_CREATED,
        tags=["team"],
    )


def _patched_fastapi_init(self: FastAPI, *args: Any, **kwargs: Any) -> None:
    _original_fastapi_init(self, *args, **kwargs)
    _install_routes(self)


def install_team_routes() -> None:
    global _installed
    if _installed:
        return
    FastAPI.__init__ = _patched_fastapi_init  # type: ignore[method-assign]
    _installed = True
