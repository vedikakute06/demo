from pydantic import BaseModel
from typing import Literal
import datetime

class FinancialHealthBreakdown(BaseModel):
    savings_score: float
    spending_score: float
    risk_score: float

class FinancialHealthResponse(BaseModel):
    user_id: str
    score: float
    breakdown: FinancialHealthBreakdown
    status: Literal["excellent", "good", "poor"]
    updated_at: datetime.datetime
