from app.database import get_database
from datetime import datetime, timezone
from bson import ObjectId

async def generate_investment_recommendation(user_id: str):
    db = get_database()

    # ✅ Get user
    user = None
    if ObjectId.is_valid(user_id):
        user = await db["user"].find_one({"_id": ObjectId(user_id)})

    if not user:
        user = await db["user"].find_one({"_id": user_id})

    if not user:
        return {"error": "User not found"}

    # ✅ Get finance
    finance = await db["finance"].find_one({"user_id": user_id})

    if finance:
        income = finance.get("monthly_income", 0)
        expenses = finance.get("total_expenses", 0)
        savings = finance.get("monthly_savings", 0)
    else:
        # Fallback: compute from user profile + transactions
        income = user.get("monthly_income", 0) or 0
        transactions = await db["transactions"].find({"user_id": user_id}).to_list(100)
        expenses = sum(t["amount"] for t in transactions if t.get("type") == "expense")
        savings = income - expenses

    if income == 0 and expenses == 0:
        return {"error": "No financial data found. Please add transactions or update your profile with income."}

    # 📊 Ratios
    expense_ratio = expenses / income if income else 0
    savings_ratio = savings / income if income else 0

    # 🛑 SAFETY CHECK
    is_safe = True
    safety_message = "You are in a good position to invest."

    if expense_ratio > 0.8:
        is_safe = False
        safety_message = "Your expenses are too high. Reduce spending before investing."

    elif savings_ratio < 0.2:
        is_safe = False
        safety_message = "Your savings are too low. Build savings before investing."

    # ✅ Risk profile
    risk = user.get("risk_profile", "medium")

    if risk == "low":
        allocation = {"FD": 50, "RD": 30, "SIP": 20}
        strategy = "Safe Growth"
    elif risk == "high":
        allocation = {"SIP": 70, "FD": 20, "RD": 10}
        strategy = "Aggressive Growth"
    else:
        allocation = {"SIP": 50, "FD": 30, "RD": 20}
        strategy = "Balanced Growth"

    # 💰 Convert % → amount
    plan = []
    for k, v in allocation.items():
        plan.append({
            "type": k,
            "allocation_percentage": v,
            "amount": round((v/100) * savings, 2)
        })

    result = {
        "user_id": user_id,
        "monthly_investable_amount": savings,
        "strategy": strategy,
        "is_safe_to_invest": is_safe,
        "safety_message": safety_message,
        "recommended_plan": plan,
        "created_at": datetime.now(timezone.utc)
    }

    # 💾 Save
    await db["investment_recommendations"].update_one(
        {"user_id": user_id},
        {"$set": result},
        upsert=True
    )

    return result