from __future__ import annotations

import os
from typing import Any

import httpx


SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    or os.getenv("SUPABASE_SERVICE_KEY", "")
)

_original_post = httpx.AsyncClient.post
_installed = False


async def _is_authorized_hub_email(email: str) -> bool:
    """Return True only for active emails present in hub_profiles.

    The service-role key is required because anonymous users must not be able
    to enumerate HUB identities through the public REST API.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return False

    normalized = email.strip().lower()
    if not normalized:
        return False

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await _original_post.__self__.get(  # type: ignore[attr-defined]
            client,
            f"{SUPABASE_URL}/rest/v1/hub_profiles",
            headers=headers,
            params={
                "email": f"eq.{normalized}",
                "active": "eq.true",
                "select": "user_id",
                "limit": "1",
            },
        )

    if response.status_code != 200:
        return False

    payload = response.json()
    return isinstance(payload, list) and len(payload) > 0


async def _guarded_post(
    self: httpx.AsyncClient,
    url: str,
    *args: Any,
    **kwargs: Any,
) -> httpx.Response:
    if url.rstrip("/") == f"{SUPABASE_URL}/auth/v1/otp":
        body = kwargs.get("json") or {}
        email = str(body.get("email") or "").strip().lower()

        if not await _is_authorized_hub_email(email):
            request = httpx.Request("POST", url)
            return httpx.Response(
                status_code=403,
                json={"message": "Email non autorizzata per ECCOMI HUB."},
                request=request,
            )

        safe_body = dict(body)
        safe_body["create_user"] = False
        kwargs["json"] = safe_body

    return await _original_post(self, url, *args, **kwargs)


def install_auth_guard() -> None:
    global _installed
    if _installed:
        return

    httpx.AsyncClient.post = _guarded_post  # type: ignore[method-assign]
    _installed = True
