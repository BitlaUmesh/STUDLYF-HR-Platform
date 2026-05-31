from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import os

from core.ratelimit import limiter

app = FastAPI(
    title="Inspira 2026 - HR SaaS API",
    description="Backend API for the Offer & Joining Letter Generator",
    version="1.0.0"
)

# Ensure uploads directory exists
os.makedirs("uploads/profiles", exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory="uploads"), name="uploads")

# Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure environments
is_prod = os.getenv("ENVIRONMENT") == "production"

# HTTPS Redirect Middleware (Enforce HTTPS in Production)
from fastapi.responses import RedirectResponse

class HTTPSRedirectProxyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if is_prod:
            forwarded_proto = request.headers.get("x-forwarded-proto", "https")
            if forwarded_proto == "http":
                url = request.url.replace(scheme="https")
                return RedirectResponse(url, status_code=301)
        return await call_next(request)

app.add_middleware(HTTPSRedirectProxyMiddleware)

# Custom Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        if is_prod:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["Content-Security-Policy"] = "default-src 'self' blob: data: 'unsafe-inline' 'unsafe-eval' https:; img-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:;"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://studlyf.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api.auth import router as auth_router
from api.documents import router as documents_router
from api.profile import router as profile_router
from api.dashboard import router as dashboard_router

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(documents_router, prefix="/api/documents", tags=["documents"])
app.include_router(profile_router, prefix="/api/profile", tags=["profile"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["dashboard"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "inspira-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
