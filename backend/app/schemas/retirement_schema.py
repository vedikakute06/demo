from pydantic import BaseModel

class RetirementRequest(BaseModel):
    retirement_age: int
    monthly_expense_post_retirement: float