from fastapi import APIRouter
from app.schemas.budget_schema import BudgetResponse
from app.services.budget_service import BudgetService

router = APIRouter(
    prefix="/budget",
    tags=["Budget"]
)

@router.get("/{user_id}/{month}", response_model=BudgetResponse)
async def get_budget(user_id: str, month: str):
    return await BudgetService.get_budget(user_id, month)