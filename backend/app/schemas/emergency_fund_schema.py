from pydantic import BaseModel
from typing import Literal
import datetime


class EmergencyFundInput(BaseModel):
    user_id: str
    monthly_expense: float
    desired_months: int
    current_emergency_savings: float


class EmergencyFundResponse(BaseModel):
    user_id: str
    monthly_expense: float
    desired_months: int
    recommended_fund: float
    current_emergency_savings: float
    gap: float
    status: Literal["good", "warning", "critical"]
    last_updated: datetime.datetime