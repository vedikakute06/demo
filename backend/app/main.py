from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import connect_to_mongo, close_mongo_connection, get_database
from app.routes.behavior import router as behavior_router
from app.routes.risk import router as risk_router
from app.routes.whatif import router as whatif_router
from app.routes.investment import router as investment_router
from app.routes.goal import router as goal_router
from app.routes.finance_health import router as financial_health_router
from app.routes.finance import router as finance_router
from app.routes.retirement import router as retirement_router
from app.routes.user_feature import router as user_feature_router
from app.routes.budget import router as budget_router
from app.routes.user import router as user_router
from app.routes.emergency_fund import router as emergency_router

print("main.py LOADED")

# 🔁 Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

# ✅ CREATE APP FIRST
app = FastAPI(lifespan=lifespan)

# ✅ CORS — allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5175",  "http://localhost:5174", "http://localhost:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ IMPORT ROUTER AFTER APP CREATION
from app.routes.transactions import router as transactions_router

print("router imported")

# ✅ INCLUDE ROUTER
app.include_router(transactions_router)
app.include_router(behavior_router)
app.include_router(risk_router)
app.include_router(whatif_router)
app.include_router(investment_router)
app.include_router(goal_router)
app.include_router(financial_health_router)
app.include_router(finance_router)
app.include_router(retirement_router)
app.include_router(user_feature_router)
app.include_router(budget_router)
app.include_router(user_router)
app.include_router(emergency_router)
# ✅ TEST ROUTES
@app.get("/")
async def root():
    return {"message": "Welcome"}

@app.get("/test-db")
async def test_db():
    db = get_database()
    collections = await db.list_collection_names()
    return {
        "message": "DB Connected ✅",
        "collections": collections
    }