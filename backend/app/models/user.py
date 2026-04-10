from typing import Optional
from pydantic import BaseModel, Field

class UserModel(BaseModel):
    name: str
    email: str
    # Add other DB-specific fields as necessary
