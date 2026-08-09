from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import Depends, FastAPI, HTTPException, status


def install_performance_connector_routes(app: FastAPI) -> None:
    from .main import HubUser, authenticated_user

    @app.get("/v1/ecosystems/performance/summary")
    async def performance_summary(
        _: HubUser = Depends(authenticated_user),
    ) -> dict[str, Any]:
        api_url = os.getenv("PERFORMANCE_API_URL", "").rstrip("/")
        read_token = os.getenv("PERFORMANCE_HUB_READ_TOKEN", "")

        if not api_url or not read_token:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="ECCOMI Performance non è ancora configurato in HUB.",
            )

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    f"{api_url}/api/hub/summary",
                    headers={"x-eccomi-hub-token": read_token},
                )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="ECCOMI Performance non è raggiungibile.",
            ) from exc

        if response.status_code in (401, 403):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Il collegamento protetto con ECCOMI Performance non è autorizzato.",
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
                detail="Risposta ECCOMI Performance non valida.",
            )

        return payload
