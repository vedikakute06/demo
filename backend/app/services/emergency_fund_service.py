from app.database import get_database
from app.schemas.emergency_fund_schema import (
    EmergencyFundResponse,
    EmergencyFundInput
)
import datetime


class EmergencyFundService:

    @staticmethod
    async def get_emergency_fund(user_id: str):
        db = get_database()

        fund = await db["emergency_fund"].find_one({
            "user_id": user_id
        })

        if not fund:
            return EmergencyFundResponse(
                user_id=user_id,
                monthly_expense=0,
                desired_months=0,
                recommended_fund=0,
                current_emergency_savings=0,
                gap=0,
                status="critical",
                last_updated=datetime.datetime.utcnow()
            )

        fund.pop("_id", None)

        # ✅ Fix datetime
        if isinstance(fund.get("last_updated"), str):
            try:
                fund["last_updated"] = datetime.datetime.strptime(
                    fund["last_updated"], "%Y-%m-%d"
                )
            except:
                fund["last_updated"] = datetime.datetime.utcnow()

        return EmergencyFundResponse(**fund)


    @staticmethod
    async def calculate_and_save(data: EmergencyFundInput):
        db = get_database()

        # ✅ calculations
        recommended_fund = data.monthly_expense * data.desired_months
        gap = recommended_fund - data.current_emergency_savings

        gap = max(gap, 0)

        # ✅ status logic
        if gap == 0:
            status = "good"
        elif gap <= recommended_fund * 0.5:
            status = "warning"
        else:
            status = "critical"

        now = datetime.datetime.utcnow()

        result = {
            "user_id": data.user_id,
            "monthly_expense": data.monthly_expense,
            "desired_months": data.desired_months,
            "recommended_fund": recommended_fund,
            "current_emergency_savings": data.current_emergency_savings,
            "gap": gap,
            "status": status,
            "last_updated": now
        }

        await db["emergency_fund"].update_one(
            {"user_id": data.user_id},
            {"$set": result},
            upsert=True
        )

        return EmergencyFundResponse(**result)