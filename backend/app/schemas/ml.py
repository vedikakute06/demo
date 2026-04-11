from pydantic import BaseModel

class WhatIfInput(BaseModel):
    user_id: str
    purchase_cost: float
    time: float
