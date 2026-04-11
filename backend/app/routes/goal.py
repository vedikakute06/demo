from fastapi import APIRouter, HTTPException
from app.services.goal_service import create_goal
from app.database import get_database
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/goals", tags=["Goals"])

# 🔹 Create goal
from app.schemas.goal_schema import GoalCreate

@router.post("/create/{user_id}")
async def create_goal_endpoint(user_id: str, data: GoalCreate):
    result = await create_goal(user_id, data.dict())

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result


# 🔹 Pay towards a goal
@router.post("/pay/{goal_id}")
async def pay_goal(goal_id: str, data: dict):
    db = get_database()

    # Validate
    if not ObjectId.is_valid(goal_id):
        raise HTTPException(status_code=400, detail="Invalid goal ID")

    amount = data.get("amount", 0)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    # Find goal
    goal = await db["goals"].find_one({"_id": ObjectId(goal_id)})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    user_id = goal["user_id"]

    # Update current_saved
    new_saved = (goal.get("current_saved", 0) or 0) + amount
    target = goal.get("target_amount", 0)

    # Check if goal is completed
    new_status = goal.get("status", "active")
    if new_saved >= target:
        new_saved = target
        new_status = "completed"

    await db["goals"].update_one(
        {"_id": ObjectId(goal_id)},
        {"$set": {
            "current_saved": new_saved,
            "status": new_status,
        }}
    )

    # Create transaction so it shows on dashboard
    now = datetime.now()
    txn = {
        "user_id": user_id,
        "amount": amount,
        "category": "Goal Savings",
        "type": "expense",
        "note": f"Payment towards: {goal.get('title', goal.get('goal_type', 'Goal'))}",
        "payment_mode": "UPI",
        "is_weekend": now.weekday() >= 5,
        "hour": now.hour,
        "date": now.strftime("%Y-%m-%d"),
        "created_at": now.strftime("%Y-%m-%d"),
    }
    await db["transactions"].insert_one(txn)

    return {
        "message": "Payment recorded",
        "goal_id": goal_id,
        "amount_paid": amount,
        "new_saved": new_saved,
        "target": target,
        "status": new_status,
    }


# 🔹 Get all goals
@router.get("/{user_id}")
async def get_goals(user_id: str):
    db = get_database()

    goals = await db["goals"].find({"user_id": user_id}).to_list(100)

    for g in goals:
        g["_id"] = str(g["_id"])

    return goals