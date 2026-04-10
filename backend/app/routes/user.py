from fastapi import APIRouter, HTTPException
from app.schemas.user import GoogleAuthRequest, UserResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/auth/google", response_model=UserResponse)
async def google_login(data: GoogleAuthRequest):
    try:
        user = await UserService.upsert_google_user(data.token)
        return user
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    user = await UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
