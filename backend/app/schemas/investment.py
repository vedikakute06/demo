from pydantic import BaseModel
from typing import List
from datetime import datetime

class InvestmentPlanItem(BaseModel):
    type: str
    allocation_percentage: float
    expected_return: float
    risk_level: str

class InvestmentRecommendationRequest(BaseModel):
    user_id: str

class InvestmentRecommendationResponse(BaseModel):
    user_id: str
    monthly_investable_amount: float
    recommended_plan: List[InvestmentPlanItem]
    strategy: str
    created_at: datetime
