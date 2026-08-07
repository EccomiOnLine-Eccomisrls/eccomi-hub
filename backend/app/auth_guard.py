from __future__ import annotations

import os
from typing import Any

import httpx


SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    or os.getenv("SUPABASE_SERVICE_KEY", "")
).strip()

_original_get = httpx.AsyncClient.get
_original_post = httpx.AsyncClient.post
_installed = False


async def _is_authorized_hub_email(email: str) -> bool:
    """Return True only for active emails present in hub_profiles."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("[HUB AUTH] allowlist unavailable: missing Supabase configuration")
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
        response = await _original_get(
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
        print(
            "[HUB AUTH] allowlist query failed "
            f"status={response.status_code} body={response.text[:500]}"
        )
        return False

    payload = response.json()
    authorized = isinstance(payload, list) and len(payload) > 0
    print(f"[HUB AUTH] allowlist email={normalized} authorized={authorized}")
    return authorized


async def _guarded_post(
    self: httpx.AsyncClient,
    url: str,
    *args: Any,
    **kwargs: Any,
) -> httpx.Response:
    is_otp_request = url.rstrip("/") == f"{SUPABASE_URL}/auth/v1/otp"

    if is_otp_request:
        body = kwargs.get("json") or {}
        email = str(body.get("email") or "").strip().lower()

        if not await _is_authorized_hub_email(email):
            print(f"[HUB AUTH] OTP blocked email={email}")
            request = httpx.Request("POST", url)
            return httpx.Response(
                status_code=403,
                json={"message": "Email non autorizzata per ECCOMI HUB."},
                request=request,
            )

    response = await _original_post(self, url, *args, **kwargs)

    if is_otp_request:
        print(
            "[HUB AUTH] Supabase OTP response "
            f"status={response.status_code} body={response.text[:500]}"
        )

    return response


def install_auth_guard() -> None:
    global _installed
    if _installed:
        return

    httpx.AsyncClient.post = _guarded_post  # type: ignore[method-assign]
    _installed = True
