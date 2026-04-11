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

        # ✅ Validate ObjectId
        try:
            user_obj_id = ObjectId(user_id)
        except:
            raise HTTPException(status_code=404, detail="Invalid user id format")

        # ✅ Check user exists
        user = await db["user"].find_one({"_id": user_obj_id})

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

        # ✅ Validate ObjectId
        try:
            user_obj_id = ObjectId(user_id)
        except:
            raise HTTPException(status_code=404, detail="Invalid user id format")

        # ✅ Check user exists
        user = await db["user"].find_one({"_id": user_obj_id})

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # ✅ Get finance data
        finance = await db["finance"].find_one({"user_id": user_id})

        if not finance:
            raise HTTPException(status_code=404, detail="Finance data not found")

        # 📊 Extract values
        monthly_expense = finance.get("total_expenses", 0)
        current_emergency_savings = finance.get("monthly_savings", 0)

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