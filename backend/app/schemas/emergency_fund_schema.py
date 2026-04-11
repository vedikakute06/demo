# app/schemas/emergency_fund_schema.py

from pydantic import BaseModel
import datetime
from typing import Literal


class EmergencyFundInput(BaseModel):
    user_id: str
    desired_months: int


class EmergencyFundResponse(BaseModel):
    user_id: str
    monthly_expense: float
    desired_months: int
    recommended_fund: float
    current_emergency_savings: float
    gap: float
    status: Literal["good", "warning", "critical"]
    last_updated: datetime.datetime