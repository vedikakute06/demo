from pydantic import BaseModel

class GoalCreate(BaseModel):
    title: str
    goal_type: str
    target_amount: float
    deadline: str