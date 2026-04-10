from pydantic import BaseModel

class WhatIfInput(BaseModel):
    income: float
    expense: float
    saving: float
    purchase_cost: float
    time: float
