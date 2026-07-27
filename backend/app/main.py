from __future__ import annotations

import os
from typing import Literal

import httpx
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field


SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")


def configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_ANON_KEY)


def supabase_headers(access_token: str | None = None) -> dict[str, str]:
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    return headers


class RequestCodeBody(BaseModel):
    email: EmailStr


class VerifyCodeBody(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class HubUser(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: Literal["ceo", "manager", "operator"]


class HubSession(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    user: HubUser


app = FastAPI(
    title="ECCOMI HUB API",
    version="0.1.0",
    docs_url=None,
    redoc_url=None,
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health")
async def health() -> dict[str, object]:
    return {
        "status": "ok",
        "service": "eccomi-hub-api",
        "integrations": {
            "supabase": configured(),
            "openai": bool(os.getenv("OPENAI_API_KEY")),
            "shopify": bool(os.getenv("SHOPIFY_ADMIN_ACCESS_TOKEN")),
        },
    }


@app.post("/v1/auth/request-code", status_code=status.HTTP_202_ACCEPTED)
async def request_code(body: RequestCodeBody) -> dict[str, bool]:
    if not configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Il collegamento reale è in preparazione. Riprova tra poco.",
        )

    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.post(
            f"{SUPABASE_URL}/auth/v1/otp",
            headers=supabase_headers(),
            json={
                "email": str(body.email).lower(),
                "create_user": True,
            },
        )

    if response.status_code == 429:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Hai richiesto troppi codici. Attendi un minuto e riprova.",
        )

    if response.status_code >= 500:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Il servizio di accesso non è momentaneamente raggiungibile.",
        )

    if not response.is_success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Il codice non è stato inviato. Verifica l'indirizzo e riprova tra poco.",
        )

    return {"accepted": True}


async def get_profile(access_token: str, user: dict[str, object]) -> HubUser:
    user_id = str(user.get("id") or "")
    email = str(user.get("email") or "")

    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/hub_profiles",
            headers=supabase_headers(access_token),
            params={
                "user_id": f"eq.{user_id}",
                "select": "user_id,email,full_name,role,active",
                "limit": "1",
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Non è stato possibile verificare il ruolo ECCOMI HUB.",
        )

    rows = response.json()
    if not rows or not rows[0].get("active"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="L'utente non è ancora abilitato a ECCOMI HUB.",
        )

    profile = rows[0]
    return HubUser(
        id=user_id,
        email=profile.get("email") or email,
        full_name=profile.get("full_name") or email.split("@")[0],
        role=profile["role"],
    )


@app.post("/v1/auth/verify-code", response_model=HubSession)
async def verify_code(body: VerifyCodeBody, request: Request) -> HubSession:
    if not configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Il collegamento reale è in preparazione. Riprova tra poco.",
        )

    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.post(
            f"{SUPABASE_URL}/auth/v1/verify",
            headers=supabase_headers(),
            json={
                "type": "email",
                "email": str(body.email).lower(),
                "token": body.code,
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Il codice non è valido oppure è scaduto.",
        )

    session = response.json()
    access_token = session.get("access_token")
    refresh_token = session.get("refresh_token")
    user = session.get("user") or {}
    if not access_token or not refresh_token or not user:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="La sessione non è stata creata correttamente.",
        )

    profile = await get_profile(access_token, user)
    return HubSession(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=int(session.get("expires_in") or 3600),
        user=profile,
    )
