from fastapi import APIRouter
from app.schemas.emergency_fund_schema import EmergencyFundResponse, EmergencyFundInput
from app.services.emergency_fund_service import EmergencyFundService

router = APIRouter(
    prefix="/emergency-fund",
    tags=["Emergency Fund"]
)

# =========================
# GET API
# =========================
@router.get("/{user_id}", response_model=EmergencyFundResponse)
async def get_emergency_fund(user_id: str):
    return await EmergencyFundService.get_emergency_fund(user_id)


# =========================
# POST API
# =========================
@router.post("/calculate", response_model=EmergencyFundResponse)
async def calculate_emergency_fund(data: EmergencyFundInput):
    return await EmergencyFundService.calculate_and_save(data)