from pydantic import BaseModel

class RiskRequest(BaseModel):
    monthly_income: float
    current_savings: float


class RiskResponse(BaseModel):
    risk_score: float
    risk_level: str
    savings_ratio: float
