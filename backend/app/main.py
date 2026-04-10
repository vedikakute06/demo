from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_to_mongo, close_mongo_connection
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="Website Backend", description="FastAPI Backend with MongoDB", version="1.0.0", lifespan=lifespan)

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

@app.get("/")
async def root():
    return {"message": "Welcome to the FastAPI Backend!"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

app.include_router(user_router)
app.include_router(ml_router)
