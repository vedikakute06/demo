from pydantic import BaseModel
from typing import List

class Transaction(BaseModel):
    amount: float
    category: int
    is_weekend: int
    hour: int

class BehaviorAnalysisRequest(BaseModel):
    user_id: str
