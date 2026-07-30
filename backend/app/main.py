from __future__ import annotations

import base64
import json
import os
from datetime import datetime, timezone
from typing import Any, Literal

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field


SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

POSTA_SUPABASE_URL = os.getenv("POSTA_SUPABASE_URL", "").rstrip("/")
POSTA_SUPABASE_SERVICE_KEY = (
    os.getenv("POSTA_SUPABASE_SERVICE_KEY", "")
    or os.getenv("SUPABASE_SERVICE_KEY_POSTA", "")
)

NOLEGGIO_API_URL = os.getenv("NOLEGGIO_API_URL", "").rstrip("/")
NOLEGGIO_HUB_READ_SECRET = os.getenv("NOLEGGIO_HUB_READ_SECRET", "")

_runtime_posta: dict[str, str] = {}


def configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_ANON_KEY)


def supabase_headers(
    access_token: str | None = None,
    api_key: str | None = None,
) -> dict[str, str]:
    key = api_key or SUPABASE_ANON_KEY
    headers = {
        "apikey": key,
        "Content-Type": "application/json",
    }
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    return headers


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def derive_supabase_url(service_key: str) -> str:
    if POSTA_SUPABASE_URL:
        return POSTA_SUPABASE_URL

    try:
        payload_part = service_key.split(".")[1]
        payload_part += "=" * (-len(payload_part) % 4)
        payload = json.loads(
            base64.urlsafe_b64decode(payload_part).decode("utf-8")
        )
        project_ref = str(payload.get("ref") or "").strip()
        if project_ref:
            return f"https://{project_ref}.supabase.co"
    except (
        IndexError,
        ValueError,
        json.JSONDecodeError,
        UnicodeDecodeError,
    ):
        pass

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=(
            "Impossibile ricavare il progetto Supabase dalla chiave. "
            "Configura POSTA_SUPABASE_URL su Render."
        ),
    )


def posta_credentials() -> tuple[str, str]:
    url = _runtime_posta.get("url") or POSTA_SUPABASE_URL
    key = _runtime_posta.get("key") or POSTA_SUPABASE_SERVICE_KEY

    if not url and key:
        url = derive_supabase_url(key)

    if not url or not key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Eccomi Posta non Ã¨ ancora collegato. Inserisci la chiave "
                "protetta oppure configura le variabili Render."
            ),
        )

    return url.rstrip("/"), key


class RequestCodeBody(BaseModel):
    email: EmailStr


class VerifyCodeBody(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class RefreshBody(BaseModel):
    refresh_token: str = Field(min_length=10)


class ConfigurePostaBody(BaseModel):
    service_key: str = Field(min_length=40)


class HubUser(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: Literal["ceo", "manager", "operator"]


class HubSession(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    expires_at: int | None = None
    user: HubUser


app = FastAPI(
    title="ECCOMI HUB API",
    version="0.2.0",
    docs_url=None,
    redoc_url=None,
)

allowed_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "service": "ECCOMI HUB API",
        "status": "online",
    }


@app.get("/health")
async def health() -> dict[str, object]:
    return {
        "status": "ok",
        "service": "eccomi-hub-api",
        "integrations": {
            "supabase": configured(),
            "posta": bool(
                _runtime_posta.get("key")
                or POSTA_SUPABASE_SERVICE_KEY
            ),
            "noleggio": bool(
                NOLEGGIO_API_URL
                and NOLEGGIO_HUB_READ_SECRET
            ),
            "openai": bool(os.getenv("OPENAI_API_KEY")),
            "shopify": bool(
                os.getenv("SHOPIFY_ADMIN_ACCESS_TOKEN")
            ),
        },
    }


async def get_profile(
    access_token: str,
    user: dict[str, Any],
) -> HubUser:
    user_id = str(user.get("id") or "")
    email = str(user.get("email") or "")

    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/hub_profiles",
            headers=supabase_headers(access_token),
            params={
                "user_id": f"eq.{user_id}",
                "select": (
                    "user_id,email,full_name,role,active"
                ),
                "limit": "1",
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Non Ã¨ stato possibile verificare il ruolo "
                "ECCOMI HUB."
            ),
        )

    rows = response.json()

    if not rows or not rows[0].get("active"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "L'utente non Ã¨ ancora abilitato a ECCOMI HUB."
            ),
        )

    profile = rows[0]

    return HubUser(
        id=user_id,
        email=profile.get("email") or email,
        full_name=(
            profile.get("full_name")
            or email.split("@")[0]
        ),
        role=profile["role"],
    )


async def authenticated_user(
    authorization: str | None = Header(default=None),
) -> HubUser:
    if (
        not authorization
        or not authorization.startswith("Bearer ")
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessione mancante.",
        )

    access_token = authorization[7:].strip()

    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers=supabase_headers(access_token),
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessione scaduta o non valida.",
        )

    return await get_profile(
        access_token,
        response.json(),
    )


async def ceo_user(
    user: HubUser = Depends(authenticated_user),
) -> HubUser:
    if user.role != "ceo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operazione riservata al CEO.",
        )
    return user


@app.post(
    "/v1/auth/request-code",
    status_code=status.HTTP_202_ACCEPTED,
)
async def request_code(
    body: RequestCodeBody,
) -> dict[str, bool]:
    if not configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Il collegamento reale Ã¨ in preparazione. "
                "Riprova tra poco."
            ),
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
            detail=(
                "Hai richiesto troppi codici. "
                "Attendi un minuto e riprova."
            ),
        )

    if response.status_code >= 500:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Il servizio di accesso non Ã¨ "
                "momentaneamente raggiungibile."
            ),
        )

    if not response.is_success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Il codice non Ã¨ stato inviato. "
                "Verifica l'indirizzo e riprova tra poco."
            ),
        )

    return {"accepted": True}


@app.post(
    "/v1/auth/verify-code",
    response_model=HubSession,
)
async def verify_code(
    body: VerifyCodeBody,
) -> HubSession:
    if not configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Il collegamento reale Ã¨ in preparazione. "
                "Riprova tra poco."
            ),
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
            detail="Il codice non Ã¨ valido oppure Ã¨ scaduto.",
        )

    session = response.json()
    access_token = session.get("access_token")
    refresh_token = session.get("refresh_token")
    user = session.get("user") or {}

    if not access_token or not refresh_token or not user:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "La sessione non Ã¨ stata creata correttamente."
            ),
        )

    profile = await get_profile(access_token, user)

    return HubSession(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=int(
            session.get("expires_in") or 3600
        ),
        expires_at=session.get("expires_at"),
        user=profile,
    )


@app.post(
    "/v1/auth/refresh",
    response_model=HubSession,
)
async def refresh_session(
    body: RefreshBody,
) -> HubSession:
    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.post(
            (
                f"{SUPABASE_URL}/auth/v1/token"
                "?grant_type=refresh_token"
            ),
            headers=supabase_headers(),
            json={"refresh_token": body.refresh_token},
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La sessione non puÃ² essere rinnovata.",
        )

    session = response.json()
    access_token = session.get("access_token")
    refresh_token = session.get("refresh_token")
    user = session.get("user") or {}

    if not access_token or not refresh_token or not user:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "La sessione non Ã¨ stata rinnovata correttamente."
            ),
        )

    profile = await get_profile(access_token, user)

    return HubSession(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=int(
            session.get("expires_in") or 3600
        ),
        expires_at=session.get("expires_at"),
        user=profile,
    )


async def verify_posta_key(
    url: str,
    key: str,
) -> None:
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{url}/rest/v1/pratiche",
            headers=supabase_headers(key, key),
            params={
                "select": "id",
                "limit": "1",
            },
        )

    if response.status_code in (401, 403):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "La chiave Supabase di Eccomi Posta "
                "non Ã¨ valida."
            ),
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La chiave Ã¨ valida, ma nel progetto indicato "
                "non Ã¨ stata trovata la tabella pratiche."
            ),
        )

    if not response.is_success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Non Ã¨ stato possibile verificare "
                "Eccomi Posta in questo momento."
            ),
        )


@app.post("/v1/ecosystems/posta/configure")
async def configure_posta(
    body: ConfigurePostaBody,
    _: HubUser = Depends(ceo_user),
) -> dict[str, bool]:
    key = body.service_key.strip()
    url = derive_supabase_url(key)

    await verify_posta_key(url, key)

    _runtime_posta["url"] = url
    _runtime_posta["key"] = key

    return {
        "configured": True,
        "verified": True,
    }


@app.get("/v1/ecosystems/posta/summary")
async def posta_summary(
    _: HubUser = Depends(authenticated_user),
) -> dict[str, Any]:
    url, key = posta_credentials()

    params = {
        "select": (
            "id,order_name,shopify_order_name,"
            "tipo_servizio,stato,ultimo_evento,"
            "ultimo_messaggio,created_at,updated_at"
        ),
        "order": "created_at.desc",
        "limit": "1000",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"{url}/rest/v1/pratiche",
            headers=supabase_headers(key, key),
            params=params,
        )

    if not response.is_success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Eccomi Posta non ha restituito "
                "i dati richiesti."
            ),
        )

    payload = response.json()
    rows = payload if isinstance(payload, list) else []
    today = datetime.now(timezone.utc).date().isoformat()

    completed_states = {
        "COMPLETATA",
        "CONSEGNATA",
        "CHIUSA",
    }
    sent_states = {
        "INVIATO_POSTE",
        "PRESA_IN_CARICO",
        "ACCETTATA_POSTE",
        "CONSEGNATA",
    }
    error_words = (
        "ERROR",
        "ERRORE",
        "KO",
        "FALLIT",
    )
    manual_words = (
        "MANUALE",
        "RICEVUTO_MANUALE",
    )

    total = len(rows)

    completed = sum(
        1
        for row in rows
        if str(
            row.get("stato") or ""
        ).upper() in completed_states
    )

    sent = sum(
        1
        for row in rows
        if str(
            row.get("stato") or ""
        ).upper() in sent_states
    )

    errors = sum(
        1
        for row in rows
        if any(
            word in str(
                row.get("stato") or ""
            ).upper()
            for word in error_words
        )
    )

    manual = sum(
        1
        for row in rows
        if any(
            word in str(
                row.get("stato") or ""
            ).upper()
            for word in manual_words
        )
    )

    created_today = sum(
        1
        for row in rows
        if str(
            row.get("created_at") or ""
        ).startswith(today)
    )

    by_service: dict[str, int] = {}

    for row in rows:
        service = (
            str(
                row.get("tipo_servizio")
                or "ALTRO"
            ).strip()
            or "ALTRO"
        )
        by_service[service] = (
            by_service.get(service, 0) + 1
        )

    recent = [
        {
            "id": str(row.get("id") or ""),
            "order_name": str(
                row.get("order_name")
                or row.get("shopify_order_name")
                or "â"
            ),
            "service": str(
                row.get("tipo_servizio") or "â"
            ),
            "status": str(
                row.get("stato") or "â"
            ),
            "last_event": str(
                row.get("ultimo_evento")
                or row.get("ultimo_messaggio")
                or "â"
            ),
            "created_at": str(
                row.get("created_at") or ""
            ),
            "updated_at": str(
                row.get("updated_at")
                or row.get("created_at")
                or ""
            ),
        }
        for row in rows[:12]
    ]

    return {
        "source": "eccomi-posta-supabase",
        "safe_read_only": True,
        "generated_at": utc_now(),
        "sample_limited": total >= 1000,
        "summary": {
            "total": total,
            "open": max(total - completed, 0),
            "completed": completed,
            "sent": sent,
            "errors": errors,
            "manual": manual,
            "created_today": created_today,
        },
        "by_service": by_service,
        "recent": recent,
    }


@app.get("/v1/ecosystems/noleggio/summary")
async def noleggio_summary(
    _: HubUser = Depends(authenticated_user),
) -> dict[str, Any]:
    if (
        not NOLEGGIO_API_URL
        or not NOLEGGIO_HUB_READ_SECRET
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Eccomi Noleggio non Ã¨ ancora collegato "
                "al nuovo backend HUB."
            ),
        )

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"{NOLEGGIO_API_URL}/api/internal/hub-summary",
            headers={
                "Authorization": (
                    f"Bearer {NOLEGGIO_HUB_READ_SECRET}"
                ),
                "Accept": "application/json",
            },
       )

    if not response.is_success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Eccomi Noleggio non ha restituito "
                "il riepilogo."
            ),
        )

    payload = response.json()
    payload.setdefault(
        "source",
        "eccomi-noleggio",
    )
    payload.setdefault(
        "safe_read_only",
        True,
    )
    payload.setdefault(
        "generated_at",
        utc_now(),
    )

    return payload


@app.get("/v1/entries")
async def list_entries(
    _: HubUser = Depends(authenticated_user),
    authorization: str = Header(),
) -> dict[str, Any]:
    token = authorization[7:].strip()

    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/hub_entries",
            headers=supabase_headers(token),
            params={
                "select": "*",
                "order": "created_at.desc",
            },
        )

    if response.status_code == 404:
        return {"entries": []}

    if not response.is_success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Non Ã¨ stato possibile caricare "
                "le New Entry."
            ),
        )

    return {"entries": response.json()}
