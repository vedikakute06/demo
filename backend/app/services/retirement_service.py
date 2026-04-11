from app.database import get_database
from datetime import datetime
from bson import ObjectId

# 🔢 Future Value Calculation (SIP)
def calculate_future_value(monthly_investment, annual_rate, years):
    r = annual_rate / 100 / 12  # monthly rate
    n = years * 12

    if r == 0:
        return monthly_investment * n

    fv = monthly_investment * (((1 + r) ** n - 1) / r)
    return round(fv, 2)


async def generate_retirement_plan(user_id: str, data: dict):
    db = get_database()

    # ✅ Find user (robust handling)
    user = None
    if ObjectId.is_valid(user_id):
        user = await db["user"].find_one({"_id": ObjectId(user_id)})

    if not user:
        user = await db["user"].find_one({"_id": user_id})

    if not user:
        return {"error": "User not found"}

    # ✅ FETCH FROM DATABASE (AUTO)
    current_age = user.get("age", 25)

    # 📊 Finance data
    finance = await db["finance"].find_one({"user_id": user_id})

    monthly_investment = 0
    if finance:
        monthly_investment = finance.get("monthly_savings", 0)

    # 🎯 Risk-based return
    risk = user.get("risk_profile", "medium")

    if risk == "low":
        expected_return = 6
    elif risk == "high":
        expected_return = 12
    else:
        expected_return = 10

    # 💰 Current savings (if existing plan exists)
    current_savings = 0
    existing_plan = await db["retirement_plans"].find_one({"user_id": user_id})

    if existing_plan:
        current_savings = existing_plan.get("current_savings", 0)

    # ✅ USER INPUT (ONLY THESE)
    retirement_age = data.get("retirement_age")
    monthly_expense = data.get("monthly_expense_post_retirement")

    if retirement_age is None or monthly_expense is None:
        return {"error": "Missing required fields"}

    # 📊 Years left
    years = retirement_age - current_age

    if years <= 0:
        return {"error": "Invalid retirement age"}

    # 💰 Future corpus calculation
    future_corpus = calculate_future_value(
        monthly_investment,
        expected_return,
        years
    )

    # ➕ Add current savings
    future_corpus += current_savings

    # 🧠 Monthly income after retirement (4% rule)
    monthly_income_possible = (future_corpus * 0.04) / 12

    # 📊 Status check
    status = "on_track"
    if monthly_income_possible < monthly_expense:
        status = "not_on_track"

    # 📦 Final result
    result = {
        "user_id": user_id,
        "current_age": current_age,
        "retirement_age": retirement_age,
        "years_to_retirement": years,
        "monthly_investment": monthly_investment,
        "expected_return_rate": expected_return,
        "current_savings": current_savings,
        "projected_corpus": round(future_corpus, 2),
        "monthly_expense_post_retirement": monthly_expense,
        "estimated_monthly_income": round(monthly_income_possible, 2),
        "status": status,
        "created_at": datetime.now().strftime("%Y-%m-%d")
    }

    # 💾 Save to DB
    await db["retirement_plans"].update_one(
        {"user_id": user_id},
        {"$set": result},
        upsert=True
    )

    return result