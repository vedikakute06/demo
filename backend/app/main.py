from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.staticfiles import StaticFiles
from app.database import connect_to_mongo, close_mongo_connection
from contextlib import asynccontextmanager
from app.schemas.risk_schema import RiskRequest, RiskResponse
from app.services.risk_service import compute_risk

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(
    title="Website Backend",
    description="FastAPI Backend with MongoDB",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,   # Disable default docs (they load from CDN)
    redoc_url=None,   # Disable default redoc
)

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
        swagger_js_url="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css",
    )

@app.get("/redoc", include_in_schema=False)
async def redoc_html():
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title=app.title + " - ReDoc",
        redoc_js_url="https://unpkg.com/redoc@next/bundles/redoc.standalone.js",
    )

# Setup CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update this to restrict origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routes.user import router as user_router
from app.routes.ml import router as ml_router
from app.routes.goal import router as goal_router
from app.routes.financial_health import router as financial_health_router
from app.routes.behavior import router as behavior_router

@app.get("/")
async def root():
    return {"message": "Welcome to the FastAPI Backend!"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/risk", response_model=RiskResponse)
def get_risk(data: RiskRequest):
    result = compute_risk(data)
    return result

app.include_router(user_router)
app.include_router(ml_router)
app.include_router(goal_router)
app.include_router(financial_health_router)
app.include_router(behavior_router)
