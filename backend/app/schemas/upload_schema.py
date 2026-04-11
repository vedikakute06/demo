from pydantic import BaseModel
from typing import Optional


class UploadResponse(BaseModel):
    message: str
    inserted_count: int
    user_id: str