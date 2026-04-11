from fastapi import APIRouter
from app.schemas.financial_health_schema import FinancialHealthResponse
from app.services.financial_health_service import FinancialHealthService

router = APIRouter(
    prefix="/financial-health",
    tags=["Financial Health"]
)

@router.get("/{user_id}", response_model=FinancialHealthResponse)
async def get_financial_health(user_id: str):
    return await FinancialHealthService.process_financial_health(user_id)