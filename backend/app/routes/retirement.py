from fastapi import APIRouter, HTTPException
from app.services.retirement_service import generate_retirement_plan
from app.schemas.retirement_schema import RetirementRequest
from app.database import get_database

router = APIRouter(prefix="/retirement", tags=["Retirement"])

# 🔹 Generate plan
@router.post("/plan/{user_id}")
async def create_retirement(user_id: str, data: RetirementRequest):
    result = await generate_retirement_plan(user_id, data.dict())

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result


# 🔹 Get plan
@router.get("/{user_id}")
async def get_retirement(user_id: str):
    db = get_database()

    data = await db["retirement_plans"].find_one({"user_id": user_id})

    if not data:
        raise HTTPException(status_code=404, detail="No plan found")

    data["_id"] = str(data["_id"])
    return data