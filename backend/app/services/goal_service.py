from app.database import get_database
from datetime import datetime
from bson import ObjectId

def calculate_months(deadline_str):
    today = datetime.now()
    deadline = datetime.strptime(deadline_str, "%Y-%m-%d")

    months = (deadline.year - today.year) * 12 + (deadline.month - today.month)
    return max(months, 1)


async def create_goal(user_id: str, data: dict):
    db = get_database()

    # ✅ Check user
    user = None
    if ObjectId.is_valid(user_id):
        user = await db["user"].find_one({"_id": ObjectId(user_id)})
    if not user:
        user = await db["user"].find_one({"_id": user_id})

    if not user:
        return {"error": "User not found"}

    # ✅ Get savings (finance or fallback)
    finance = await db["finance"].find_one({"user_id": user_id})

    if finance:
        current_saved = finance.get("monthly_savings", 0)
    else:
        current_saved = 0

    # ✅ Calculate months
    months = calculate_months(data["deadline"])

    # ✅ Remaining amount
    remaining = data["target_amount"] - current_saved

    # ✅ Monthly saving required
    monthly_required = round(remaining / months, 2)

    # ✅ Check affordability
    status = "active"
    if finance:
        savings = finance.get("monthly_savings", 0)
        if monthly_required > savings:
            status = "risky"

    # 📦 Final document
    goal = {
        "user_id": user_id,
        "title": data["title"],
        "goal_type": data["goal_type"],
        "target_amount": data["target_amount"],
        "current_saved": current_saved,
        "deadline": data["deadline"],
        "monthly_saving_required": monthly_required,
        "status": status,
        "created_at": datetime.now().strftime("%Y-%m-%d")
    }

    # 💾 Save
    result = await db["goals"].insert_one(goal)

    goal["_id"] = str(result.inserted_id)

    return goal