from __future__ import annotations

from typing import Any

import httpx
from fastapi import Header, HTTPException

from . import team_routes

_installed = False
_original_create_responsible = team_routes.create_responsible


async def _profile_by_email(email: str) -> dict[str, Any] | None:
    """Read any existing HUB profile for this email, regardless of role."""
    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.get(
            f"{team_routes.SUPABASE_URL}/rest/v1/hub_profiles",
            headers=team_routes._service_headers(),
            params={
                "email": f"eq.{email}",
                "select": "user_id,ec_id,email,full_name,role,ecosystem_keys,active",
                "limit": "1",
            },
        )
    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail="Non è stato possibile verificare il profilo HUB esistente.",
        )
    rows = response.json()
    return rows[0] if rows else None


async def _safe_create_responsible(
    body: team_routes.ResponsibleInput,
    authorization: str | None = Header(default=None),
) -> team_routes.ResponsibleProfile:
    """Never overwrite CEO/operator identities when assigning a manager."""
    await team_routes._require_ceo(authorization)
    email = str(body.email).strip().lower()
    existing_profile = await _profile_by_email(email)

    if existing_profile and existing_profile.get("role") != "manager":
        role = str(existing_profile.get("role") or "profilo esistente")
        raise HTTPException(
            status_code=409,
            detail=(
                f"L'indirizzo {email} appartiene già a un profilo HUB con ruolo "
                f"'{role}'. Il ruolo esistente è protetto e non può essere trasformato "
                "in Responsabile. Usa un'altra identità oppure modifica il ruolo con una "
                "procedura amministrativa dedicata."
            ),
        )

    return await _original_create_responsible(body, authorization)


def install_team_safety_patch() -> None:
    global _installed
    if _installed:
        return
    team_routes.create_responsible = _safe_create_responsible
    _installed = True
