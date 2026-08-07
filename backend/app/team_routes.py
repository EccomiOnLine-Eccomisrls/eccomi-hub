from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, EmailStr, Field

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()
SUPABASE_SERVICE_ROLE_KEY = (os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or os.getenv("SUPABASE_SERVICE_KEY", "")).strip()
_original_fastapi_init = FastAPI.__init__
_installed = False

# New Responsabili start with only basic offer management enabled.
# Every additional power is explicitly granted by the CEO.
PERMISSION_DEFAULTS: dict[str, bool] = {
    "offers": True,
    "approve": False,
    "publish": False,
    "leads": False,
    "negotiations": False,
    "documents": False,
    "cases": False,
    "archive": False,
    "export": False,
}

PERMISSION_DEPENDENCIES: dict[str, tuple[str, ...]] = {
    "approve": ("offers",),
    "publish": ("offers", "approve"),
    "archive": ("cases",),
}


class ResponsibleInput(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    ecosystem_key: str = Field(pattern=r"^[a-z0-9_-]+$")


class ResponsibleStatusInput(BaseModel):
    active: bool


class ResponsibleProfile(BaseModel):
    user_id: str
    ec_id: str
    email: EmailStr
    full_name: str
    role: str
    ecosystem_keys: list[str]
    active: bool


class DelegationUpdate(BaseModel):
    permissions: dict[str, bool]


class DelegationState(BaseModel):
    user_id: str
    ecosystem_key: str
    permissions: dict[str, bool]


class PermissionCheck(BaseModel):
    permission: str
    allowed: bool


def _service_headers() -> dict[str, str]:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=503, detail="Gestione responsabili non configurata: manca la Service Role Key.")
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


async def _auth_user(authorization: str | None) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Sessione mancante.")
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Sessione mancante.")
    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {token}"},
        )
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Sessione scaduta o non valida.")
    return response.json()


async def _profile_for_user(user_id: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/hub_profiles",
            headers=_service_headers(),
            params={
                "user_id": f"eq.{user_id}",
                "select": "user_id,ec_id,email,full_name,role,ecosystem_keys,active",
                "limit": "1",
            },
        )
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Non è stato possibile leggere il profilo HUB.")
    rows = response.json()
    if not rows:
        raise HTTPException(status_code=403, detail="Utente non abilitato a ECCOMI HUB.")
    return rows[0]


async def _require_ceo(authorization: str | None) -> dict[str, Any]:
    user = await _auth_user(authorization)
    profile = await _profile_for_user(str(user.get("id") or ""))
    if profile.get("role") != "ceo" or not profile.get("active"):
        raise HTTPException(status_code=403, detail="Operazione riservata al CEO.")
    return user


async def _require_manager(authorization: str | None) -> dict[str, Any]:
    user = await _auth_user(authorization)
    profile = await _profile_for_user(str(user.get("id") or ""))
    if profile.get("role") != "manager" or not profile.get("active"):
        raise HTTPException(status_code=403, detail="Profilo Responsabile non attivo.")
    return profile


def _normalize_permissions(raw: dict[str, Any] | None) -> dict[str, bool]:
    normalized = {
        key: bool((raw or {}).get(key, default))
        for key, default in PERMISSION_DEFAULTS.items()
    }

    # Forward dependency validation.
    if normalized["approve"] and not normalized["offers"]:
        normalized["approve"] = False
    if normalized["publish"] and (not normalized["offers"] or not normalized["approve"]):
        normalized["publish"] = False
    if normalized["archive"] and not normalized["cases"]:
        normalized["archive"] = False

    # Reverse dependency cascade.
    if not normalized["offers"]:
        normalized["approve"] = False
        normalized["publish"] = False
    if not normalized["approve"]:
        normalized["publish"] = False
    if not normalized["cases"]:
        normalized["archive"] = False

    return normalized


async def _read_delegations(user_id: str, ecosystem_key: str) -> DelegationState:
    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/hub_manager_delegations",
            headers=_service_headers(),
            params={
                "user_id": f"eq.{user_id}",
                "ecosystem_key": f"eq.{ecosystem_key}",
                "select": "user_id,ecosystem_key,permissions",
                "limit": "1",
            },
        )
    if response.status_code in (404, 400):
        raise HTTPException(status_code=503, detail="Archivio deleghe non ancora attivato in Supabase.")
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Non è stato possibile leggere le deleghe del Responsabile.")
    rows = response.json()
    if not rows:
        return DelegationState(user_id=user_id, ecosystem_key=ecosystem_key, permissions=_normalize_permissions(None))
    row = rows[0]
    return DelegationState(
        user_id=user_id,
        ecosystem_key=ecosystem_key,
        permissions=_normalize_permissions(row.get("permissions")),
    )


async def _write_delegations(user_id: str, ecosystem_key: str, permissions: dict[str, bool], updated_by: str) -> DelegationState:
    normalized = _normalize_permissions(permissions)
    row = {
        "user_id": user_id,
        "ecosystem_key": ecosystem_key,
        "permissions": normalized,
        "updated_by": updated_by,
        "updated_at": "now()",
    }
    # PostgREST does not evaluate now() strings, so omit updated_at and let the
    # database default handle creation; future trigger can maintain updates.
    row.pop("updated_at", None)
    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/hub_manager_delegations",
            headers={**_service_headers(), "Prefer": "resolution=merge-duplicates,return=representation"},
            params={"on_conflict": "user_id"},
            json=row,
        )
    if response.status_code in (404, 400):
        raise HTTPException(status_code=503, detail="Archivio deleghe non ancora attivato in Supabase.")
    if response.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail=f"Salvataggio delle deleghe non riuscito: {response.text[:240]}")
    return DelegationState(user_id=user_id, ecosystem_key=ecosystem_key, permissions=normalized)


async def _find_or_create_auth_user(email: str) -> str:
    headers = _service_headers()
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(f"{SUPABASE_URL}/auth/v1/admin/users", headers=headers, params={"page": "1", "per_page": "1000"})
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="Non è stato possibile leggere gli utenti HUB.")
        payload = response.json()
        users = payload.get("users", payload if isinstance(payload, list) else [])
        for user in users:
            if str(user.get("email") or "").strip().lower() == email:
                return str(user.get("id") or "")
        create_response = await client.post(f"{SUPABASE_URL}/auth/v1/admin/users", headers=headers, json={"email": email, "email_confirm": True})
        if create_response.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail=f"Non è stato possibile creare l'identità HUB: {create_response.text[:300]}")
        return str(create_response.json().get("id") or "")


def _ecosystem_code(ecosystem_key: str) -> str:
    return {"noleggio":"NOL","posta":"POS","energia":"ENE","spedizioni":"SPE","pec":"PEC"}.get(ecosystem_key, ecosystem_key[:3].upper())


async def _list_responsibles() -> list[ResponsibleProfile]:
    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/hub_profiles",
            headers=_service_headers(),
            params={"role":"eq.manager","select":"user_id,ec_id,email,full_name,role,ecosystem_keys,active","order":"created_at.asc"},
        )
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Non è stato possibile leggere i responsabili.")
    return [ResponsibleProfile(**row) for row in response.json()]


async def list_responsibles(authorization: str | None = Header(default=None)) -> list[ResponsibleProfile]:
    await _require_ceo(authorization)
    return await _list_responsibles()


async def create_responsible(body: ResponsibleInput, authorization: str | None = Header(default=None)) -> ResponsibleProfile:
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
    row = {"user_id":user_id,"ec_id":ec_id,"email":email,"full_name":full_name,"role":"manager","ecosystem_keys":[ecosystem_key],"active":True}
    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/hub_profiles",
            headers={**_service_headers(),"Prefer":"resolution=merge-duplicates,return=representation"},
            params={"on_conflict":"user_id"},
            json=row,
        )
    if response.status_code not in (200,201):
        if response.status_code in (401,403):
            raise HTTPException(status_code=503, detail="La Service Role non può ancora scrivere in hub_profiles. Concedi INSERT e UPDATE alla tabella e riprova.")
        raise HTTPException(status_code=502, detail=f"Salvataggio responsabile non riuscito: {response.text[:300]}")
    payload=response.json()
    saved=payload[0] if isinstance(payload,list) and payload else row
    return ResponsibleProfile(**saved)


async def set_responsible_status(user_id: str, body: ResponsibleStatusInput, authorization: str | None = Header(default=None)) -> ResponsibleProfile:
    await _require_ceo(authorization)
    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.patch(
            f"{SUPABASE_URL}/rest/v1/hub_profiles",
            headers={**_service_headers(),"Prefer":"return=representation"},
            params={"user_id":f"eq.{user_id}","role":"eq.manager"},
            json={"active":body.active},
        )
    if response.status_code not in (200,204):
        raise HTTPException(status_code=502, detail="Aggiornamento stato responsabile non riuscito.")
    payload=response.json() if response.content else []
    if not payload:
        raise HTTPException(status_code=404, detail="Responsabile non trovato.")
    return ResponsibleProfile(**payload[0])


async def get_responsible_delegations(user_id: str, authorization: str | None = Header(default=None)) -> DelegationState:
    await _require_ceo(authorization)
    profile = await _profile_for_user(user_id)
    if profile.get("role") != "manager":
        raise HTTPException(status_code=404, detail="Responsabile non trovato.")
    ecosystem_keys = profile.get("ecosystem_keys") or []
    ecosystem_key = ecosystem_keys[0] if ecosystem_keys else "noleggio"
    return await _read_delegations(user_id, ecosystem_key)


async def update_responsible_delegations(user_id: str, body: DelegationUpdate, authorization: str | None = Header(default=None)) -> DelegationState:
    ceo = await _require_ceo(authorization)
    profile = await _profile_for_user(user_id)
    if profile.get("role") != "manager":
        raise HTTPException(status_code=404, detail="Responsabile non trovato.")
    ecosystem_keys = profile.get("ecosystem_keys") or []
    ecosystem_key = ecosystem_keys[0] if ecosystem_keys else "noleggio"
    return await _write_delegations(user_id, ecosystem_key, body.permissions, str(ceo.get("id") or ""))


async def get_my_delegations(authorization: str | None = Header(default=None)) -> DelegationState:
    profile = await _require_manager(authorization)
    ecosystem_keys = profile.get("ecosystem_keys") or []
    ecosystem_key = ecosystem_keys[0] if ecosystem_keys else "noleggio"
    return await _read_delegations(str(profile.get("user_id") or ""), ecosystem_key)


async def check_my_permission(permission: str, authorization: str | None = Header(default=None)) -> PermissionCheck:
    profile = await _require_manager(authorization)
    if permission not in PERMISSION_DEFAULTS:
        raise HTTPException(status_code=404, detail="Permesso non riconosciuto.")
    ecosystem_keys = profile.get("ecosystem_keys") or []
    ecosystem_key = ecosystem_keys[0] if ecosystem_keys else "noleggio"
    state = await _read_delegations(str(profile.get("user_id") or ""), ecosystem_key)
    return PermissionCheck(permission=permission, allowed=bool(state.permissions.get(permission)))


def _install_routes(app: FastAPI) -> None:
    app.add_api_route("/v1/team/responsibles", list_responsibles, methods=["GET"], response_model=list[ResponsibleProfile], tags=["team"])
    app.add_api_route("/v1/team/responsibles", create_responsible, methods=["POST"], response_model=ResponsibleProfile, status_code=201, tags=["team"])
    app.add_api_route("/v1/team/responsibles/{user_id}/status", set_responsible_status, methods=["PATCH"], response_model=ResponsibleProfile, tags=["team"])
    app.add_api_route("/v1/team/responsibles/{user_id}/delegations", get_responsible_delegations, methods=["GET"], response_model=DelegationState, tags=["team"])
    app.add_api_route("/v1/team/responsibles/{user_id}/delegations", update_responsible_delegations, methods=["PUT"], response_model=DelegationState, tags=["team"])
    app.add_api_route("/v1/team/me/delegations", get_my_delegations, methods=["GET"], response_model=DelegationState, tags=["team"])
    app.add_api_route("/v1/team/me/permissions/{permission}", check_my_permission, methods=["GET"], response_model=PermissionCheck, tags=["team"])


def _patched_fastapi_init(self: FastAPI, *args: Any, **kwargs: Any) -> None:
    _original_fastapi_init(self, *args, **kwargs)
    _install_routes(self)


def install_team_routes() -> None:
    global _installed
    if _installed:
        return
    FastAPI.__init__ = _patched_fastapi_init  # type: ignore[method-assign]
    _installed = True
