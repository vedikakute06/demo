from bson import ObjectId
from fastapi import HTTPException
from app.database import get_database
from app.schemas.emergency_fund_schema import EmergencyFundResponse, EmergencyFundInput
import datetime


class EmergencyFundService:

    # =========================
    # GET Emergency Fund
    # =========================
    @staticmethod
    async def get_emergency_fund(user_id: str):
        db = get_database()

        # ✅ Find user (robust handling)
        user = None
        if ObjectId.is_valid(user_id):
            user = await db["user"].find_one({"_id": ObjectId(user_id)})

        if not user:
            user = await db["user"].find_one({"_id": user_id})

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # ✅ Fetch emergency fund
        fund = await db["emergency_fund"].find_one({"user_id": user_id})

        if not fund:
            raise HTTPException(status_code=404, detail="Emergency fund not found")

        fund.pop("_id", None)

        return fund


    # =========================
    # POST: Calculate + Save
    # =========================
    @staticmethod
    async def calculate_and_save(data: EmergencyFundInput):
        db = get_database()

        user_id = data.user_id
        desired_months = data.desired_months

        # ✅ Find user (robust handling)
        user = None
        if ObjectId.is_valid(user_id):
            user = await db["user"].find_one({"_id": ObjectId(user_id)})

        if not user:
            user = await db["user"].find_one({"_id": user_id})

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # ✅ Get finance data
        finance = await db["finance"].find_one({"user_id": user_id})

        monthly_expense = 0
        current_emergency_savings = 0

        if finance:
            monthly_expense = finance.get("total_expenses", 0)
            current_emergency_savings = finance.get("monthly_savings", 0)
        else:
            # Fallback to transactions and user profile (mirrors Dashboard logic)
            txns = await db["transactions"].find({"user_id": user_id}).to_list(100)
            monthly_expense = sum(t["amount"] for t in txns if t.get("type") == "expense")
            
            user_income = user.get("monthly_income", 0) or 0
            if user_income > 0:
                income = user_income
            else:
                income = sum(t["amount"] for t in txns if t.get("type") == "income")
            
            current_emergency_savings = income - monthly_expense

        # Clamp max
        current_emergency_savings = max(0, current_emergency_savings)

        # 🧮 Calculations
        recommended_fund = monthly_expense * desired_months
        gap = max(recommended_fund - current_emergency_savings, 0)

        # ⚖️ Status logic
        if gap == 0:
            status = "good"
        elif gap <= recommended_fund * 0.5:
            status = "warning"
        else:
            status = "critical"

        # 📦 Result
        result = {
            "user_id": user_id,
            "monthly_expense": monthly_expense,
            "desired_months": desired_months,
            "recommended_fund": recommended_fund,
            "current_emergency_savings": current_emergency_savings,
            "gap": gap,
            "status": status,
            "last_updated": datetime.datetime.utcnow()
        }

        # 💾 Save to DB
        await db["emergency_fund"].update_one(
            {"user_id": user_id},
            {"$set": result},
            upsert=True
        )

        return result