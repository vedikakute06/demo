from fastapi import APIRouter
from app.schemas.finance_schema import FinanceResponse
from app.services.finance_service import FinanceService

router = APIRouter(
    prefix="/finance",
    tags=["Finance"]
)

@router.get("/{user_id}", response_model=FinanceResponse)
async def get_finance(user_id: str):
    return await FinanceService.process_finance(user_id)