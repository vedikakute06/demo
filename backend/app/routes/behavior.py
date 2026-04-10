from fastapi import APIRouter
from app.schemas.behavior import BehaviorAnalysisRequest
from app.ml.behavior_prediction import predict_behavior
from app.database import get_database
from datetime import datetime, timezone

router = APIRouter(prefix="/behavior", tags=["Behavior Analysis"])

@router.post("/analyze")
async def analyze_behavior_endpoint(data: BehaviorAnalysisRequest):
    result = predict_behavior(data)
    
    # Save insights to MongoDB
    db = get_database()
    
    document = {
        "user_id": data.user_id,
        "cluster": result["cluster"],
        "insights": result["insights"],
        "confidence": result["confidence"],
        "updated_at": datetime.now(timezone.utc)
    }
    
    # MongoDB operations are async when using Motor
    await db["behavior_insights"].insert_one(document)
    
    return {
        "prediction": result,
        "saved_to_db": True
    }
