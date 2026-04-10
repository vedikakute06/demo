from pydantic import BaseModel, Field
from typing import Optional, Literal
import datetime
import uuid

class GoalCreate(BaseModel):
    user_id: str
    goal_type: Literal["travel", "gadget", "vehicle", "emergency", "investment", "other"]
    target_amount: float
    current_saved: float
    timeline_months: int

class GoalUpdateSavings(BaseModel):
    amount: float

class GoalResponse(GoalCreate):
    goal_id: str
    status: Literal["active", "completed"] = "active"
    monthly_required: float
    progress: float
    created_at: datetime.datetime
    updated_at: datetime.datetime
