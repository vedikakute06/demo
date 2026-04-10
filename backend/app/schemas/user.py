from pydantic import BaseModel, EmailStr
from typing import Optional

class GoogleAuthRequest(BaseModel):
    token: str

class UserSchema(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    picture: Optional[str] = None

class UserResponse(UserSchema):
    pass
