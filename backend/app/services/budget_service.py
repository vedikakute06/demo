from app.database import get_database
from app.schemas.budget_schema import BudgetResponse
import datetime

class BudgetService:

    @staticmethod
    async def get_budget(user_id: str, month: str):
        db = get_database()

        budget = await db["budgets"].find_one({
            "user_id": user_id,
            "month": month
        })

        if not budget:
            return BudgetResponse(
                user_id=user_id,
                month=month,
                category_limits={},
                total_budget=0,
                created_at=datetime.datetime.utcnow()
            )

        # ✅ remove MongoDB _id
        budget.pop("_id", None)

        # ✅ FIX: convert string to datetime if needed
        if isinstance(budget.get("created_at"), str):
            budget["created_at"] = datetime.datetime.strptime(
                budget["created_at"], "%Y-%m-%d"
            )

        return BudgetResponse(**budget)