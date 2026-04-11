from fastapi import APIRouter, HTTPException
from app.services.risk_service import compute_risk
from app.database import get_database

router = APIRouter(prefix="/risk", tags=["Risk"])

# 🔹 Generate risk
@router.get("/analyze/{user_id}")
async def analyze_risk(user_id: str):
    result = await compute_risk(user_id)

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result


# 🔹 Get saved risk
@router.get("/{user_id}")
async def get_risk(user_id: str):
    db = get_database()

    data = await db["risk_scores"].find_one({"user_id": user_id})

    if not data:
        raise HTTPException(status_code=404, detail="No risk data found")

    data["_id"] = str(data["_id"])

    return data