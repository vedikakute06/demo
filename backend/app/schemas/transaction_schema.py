from pydantic import BaseModel
from typing import Optional

class Transaction(BaseModel):
    user_id: str
    amount: float
    category: str
    type: str  # expense/income
    note: Optional[str] = None
    payment_mode: Optional[str] = None
    is_weekend: bool
    hour: int
    date: Optional[str] = None  # user can send OR auto-generate