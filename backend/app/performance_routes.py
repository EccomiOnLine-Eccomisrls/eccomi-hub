from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import Depends, FastAPI, HTTPException, status

from .manager_access import CurrentHubProfile, current_hub_profile

PERFORMANCE_API_URL = os.getenv("PERFORMANCE_API_URL", "").strip().rstrip("/")
PERFORMANCE_HUB_READ_SECRET = os.getenv("PERFORMANCE_HUB_READ_SECRET", "").strip()


async def performance_summary(
    _: CurrentHubProfile = Depends(current_hub_profile),
) -> dict[str, Any]:
    if not PERFORMANCE_API_URL or not PERFORMANCE_HUB_READ_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ECCOMI Performance non è ancora configurato nel backend HUB.",
        )

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"{PERFORMANCE_API_URL}/api/internal/hub-summary",
            headers={
                "Authorization": f"Bearer {PERFORMANCE_HUB_READ_SECRET}",
                "Accept": "application/json",
            },
        )

    if not response.is_success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="ECCOMI Performance non ha restituito il riepilogo richiesto.",
        )

    payload = response.json()
    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="ECCOMI Performance ha restituito un formato non valido.",
        )

    payload.setdefault("source", "eccomi-performance")
    payload.setdefault("safe_read_only", True)
    return payload


def install_performance_routes(app: FastAPI) -> None:
    if any(route.path == "/v1/ecosystems/performance/summary" for route in app.routes):
        return

    app.add_api_route(
        "/v1/ecosystems/performance/summary",
        performance_summary,
        methods=["GET"],
        tags=["ecosystems"],
    )
