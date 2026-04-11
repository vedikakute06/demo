from fastapi import APIRouter, HTTPException
from app.schemas.behavior import BehaviorAnalysisRequest
from app.services.behavior_service import analyze_user_behavior
from app.database import get_database

router = APIRouter(prefix="/behavior", tags=["Behavior Analysis"])

# ✅ POST → Run ML + Save
@router.post("/analyze")
async def analyze_behavior_endpoint(data: BehaviorAnalysisRequest):
    result = await analyze_user_behavior(data.user_id)

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return {
        "prediction": result,
        "saved_to_db": True
    }

# ✅ GET → Fetch stored insights
@router.get("/analyze/{user_id}")
async def get_behavior_insights(user_id: str):
    db = get_database()

    cursor = db["behaviour_insights"].find({"user_id": user_id})
    insights = await cursor.to_list(length=100)

    for insight in insights:
        insight["_id"] = str(insight["_id"])

    return {"insights": insights}