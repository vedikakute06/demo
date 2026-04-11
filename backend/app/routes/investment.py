from fastapi import APIRouter, HTTPException
from app.services.investment_service import generate_investment_recommendation
from app.database import get_database

router = APIRouter(prefix="/investment", tags=["Investment"])

# 🔹 Generate recommendation
@router.get("/recommend/{user_id}")
async def recommend(user_id: str):
    result = await generate_investment_recommendation(user_id)

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result


# 🔹 Get saved recommendation
@router.get("/{user_id}")
async def get_recommendation(user_id: str):
    db = get_database()

    data = await db["investment_recommendations"].find_one({"user_id": user_id})

    if not data:
        raise HTTPException(status_code=404, detail="No recommendation found")

    data["_id"] = str(data["_id"])
    return data