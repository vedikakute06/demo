from pydantic import BaseModel
from typing import Literal
import datetime


class Investment(BaseModel):
    sip: float
    fd: float
    stocks: float
    mutual_funds: float
    total_investments: float
    net_worth: float


class Liabilities(BaseModel):
    loan: float
    credit_card_due: float


class FinanceResponse(BaseModel):
    user_id: str

    monthly_income: float
    fixed_expenses: float
    variable_expenses: float
    total_expenses: float
    monthly_savings: float
    savings_rate: float

    investments: Investment
    liabilities: Liabilities

    financial_status: Literal["stable", "warning", "critical"]

    last_updated: datetime.datetime