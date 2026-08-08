from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any
from urllib.parse import quote

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query, status

from .manager_access import CurrentHubProfile, current_hub_profile

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    or os.getenv("SUPABASE_SERVICE_KEY", "")
).strip()
HUB_SSO_SECRET = os.getenv("HUB_SSO_SECRET", "").strip()
NOLEGGIO_SSO_BASE_URL = os.getenv(
    "NOLEGGIO_SSO_BASE_URL",
    "https://noleggio.eccomionline.com",
).strip().rstrip("/")


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _service_headers() -> dict[str, str]:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SSO HUB non disponibile: configurazione Supabase incompleta.",
        )
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


async def _manager_permissions(profile: CurrentHubProfile) -> dict[str, bool]:
    if profile.role != "manager":
        return {}
    ecosystem_key = profile.ecosystem_keys[0] if profile.ecosystem_keys else "noleggio"
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/hub_manager_delegations",
            headers=_service_headers(),
            params={
                "user_id": f"eq.{profile.user_id}",
                "ecosystem_key": f"eq.{ecosystem_key}",
                "select": "permissions",
                "limit": "1",
            },
        )
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Non è stato possibile leggere le deleghe per l'accesso Noleggio.")
    rows: list[dict[str, Any]] = response.json()
    if not rows:
        return {"offers": True}
    raw = rows[0].get("permissions")
    return raw if isinstance(raw, dict) else {"offers": True}


def _sanitize_next(value: str) -> str:
    if not value.startswith("/") or value.startswith("//"):
        return "/ceo"
    return value[:200]


async def create_noleggio_handoff(
    next_path: str = Query(default="/ceo", alias="next"),
    profile: CurrentHubProfile = Depends(current_hub_profile),
) -> dict[str, str]:
    if not HUB_SSO_SECRET:
        raise HTTPException(status_code=503, detail="SSO HUB → Noleggio non ancora configurato.")

    role = profile.role.strip().lower()
    if role not in {"ceo", "manager"}:
        raise HTTPException(status_code=403, detail="Ruolo non abilitato ad accedere a Eccomi Noleggio.")
    if role == "manager" and "noleggio" not in profile.ecosystem_keys:
        raise HTTPException(status_code=403, detail="Responsabile non assegnato a Eccomi Noleggio.")

    now = int(time.time())
    payload = {
        "iss": "eccomi-hub",
        "aud": "eccomi-noleggio",
        "sub": profile.user_id,
        "email": str(profile.email).strip().lower(),
        "name": profile.full_name,
        "role": role,
        "ecosystems": profile.ecosystem_keys,
        "permissions": await _manager_permissions(profile),
        "iat": now,
        "exp": now + 90,
        "nonce": secrets.token_urlsafe(12),
        "next": _sanitize_next(next_path),
    }
    encoded = _b64url(json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))
    signature = _b64url(hmac.new(HUB_SSO_SECRET.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).digest())
    token = f"{encoded}.{signature}"
    return {"url": f"{NOLEGGIO_SSO_BASE_URL}/api/auth/hub-sso?token={quote(token, safe='')}"}


def install_noleggio_sso_routes(app: FastAPI) -> None:
    if any(route.path == "/v1/sso/noleggio" for route in app.routes):
        return
    app.add_api_route(
        "/v1/sso/noleggio",
        create_noleggio_handoff,
        methods=["GET"],
        tags=["sso"],
    )
