'''from fastapi import APIRouter, HTTPException
from app.schemas.user import GoogleAuthRequest, UserResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/auth/google", response_model=UserResponse)
async def google_login(data: GoogleAuthRequest):
    try:
        user = await UserService.upsert_google_user(data.token)
        return user
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    user = await UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user'''

from fastapi import APIRouter, HTTPException
from app.database import get_database
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/user", tags=["User"])


# ✅ REGISTER
@router.post("/register")
async def register_user(data: dict):
    db = get_database()

    existing = await db["user"].find_one({"email": data["email"]})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    user_doc = {
        "name": data["name"],
        "email": data["email"],
        "password": data["password"],
        "onboarding_completed": False,
        "created_at": datetime.now().strftime("%Y-%m-%d")
    }

    result = await db["user"].insert_one(user_doc)

    return {
        "message": "User registered",
        "user_id": str(result.inserted_id),
        "onboarding_completed": False
    }


# ✅ LOGIN
@router.post("/login")
async def login_user(data: dict):
    db = get_database()

    user = await db["user"].find_one({
        "email": data["email"],
        "password": data["password"]
    })

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "message": "Login successful",
        "user_id": str(user["_id"]),
        "onboarding_completed": user.get("onboarding_completed", False)
    }


# ✅ ONBOARDING
@router.post("/onboarding/{user_id}")
async def complete_onboarding(user_id: str, data: dict):
    db = get_database()

    update_data = {
        "age": data.get("age"),
        "profession": data.get("profession"),
        "monthly_income": data.get("monthly_income"),
        "fixed_expenses": data.get("fixed_expenses"),
        "risk_profile": data.get("risk_profile"),
        "onboarding_completed": True
    }

    result = await db["user"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "Onboarding completed"}


# ✅ GET USER PROFILE
@router.get("/{user_id}")
async def get_user(user_id: str):
    db = get_database()

    user = await db["user"].find_one({"_id": ObjectId(user_id)})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user["_id"] = str(user["_id"])
    return user
