from fastapi import APIRouter, HTTPException
from app.services.goal_service import create_goal
from app.database import get_database

router = APIRouter(prefix="/goals", tags=["Goals"])

# 🔹 Create goal
from app.schemas.goal_schema import GoalCreate

@router.post("/create/{user_id}")
async def create_goal_endpoint(user_id: str, data: GoalCreate):
    result = await create_goal(user_id, data.dict())

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result


# 🔹 Get all goals
@router.get("/{user_id}")
async def get_goals(user_id: str):
    db = get_database()

    goals = await db["goals"].find({"user_id": user_id}).to_list(100)

    for g in goals:
        g["_id"] = str(g["_id"])

    return goals