from pydantic import BaseModel
from typing import Dict
import datetime

class BudgetResponse(BaseModel):
    user_id: str
    month: str
    category_limits: Dict[str, float]
    total_budget: float
    created_at: datetime.datetime