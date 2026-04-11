from fastapi import APIRouter, HTTPException
from app.services.user_feature_service import generate_user_features
from app.database import get_database

router = APIRouter(prefix="/user-feature", tags=["User Features"])

# 🔹 Generate features
@router.get("/generate/{user_id}")
async def generate_features(user_id: str):
    result = await generate_user_features(user_id)

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result


# 🔹 Get features
@router.get("/{user_id}")
async def get_features(user_id: str):
    db = get_database()

    data = await db["user_feature"].find_one({"user_id": user_id})

    if not data:
        raise HTTPException(status_code=404, detail="No features found")

    data["_id"] = str(data["_id"])
    return data