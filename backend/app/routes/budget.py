from fastapi import APIRouter
from app.schemas.budget_schema import BudgetResponse
from app.services.budget_service import BudgetService
from app.database import get_database
from datetime import datetime

router = APIRouter(
    prefix="/budget",
    tags=["Budget"]
)

@router.get("/{user_id}/{month}", response_model=BudgetResponse)
async def get_budget(user_id: str, month: str):
    return await BudgetService.get_budget(user_id, month)


@router.post("/create")
async def create_budget(data: dict):
    db = get_database()

    user_id = data.get("user_id")
    month = data.get("month")
    category_limits = data.get("category_limits", {})
    total_budget = sum(category_limits.values())

    budget_doc = {
        "user_id": user_id,
        "month": month,
        "category_limits": category_limits,
        "total_budget": total_budget,
        "created_at": datetime.now().strftime("%Y-%m-%d"),
    }

    await db["budgets"].update_one(
        {"user_id": user_id, "month": month},
        {"$set": budget_doc},
        upsert=True,
    )

    return {"message": "Budget saved", "total_budget": total_budget, "category_limits": category_limits}