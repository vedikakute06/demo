from google.oauth2 import id_token
from google.auth.transport import requests
from app.database import get_database
from app.schemas.user import UserResponse
import os

# You should set this in your .env later!
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "527117658224-v8noc46rnp69nruvoubv0jgvn2alvfge.apps.googleusercontent.com")

class UserService:
    @staticmethod
    async def upsert_google_user(token: str) -> UserResponse:
        # 1. Verify token
        try:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        except ValueError as e:
            raise ValueError(f"Invalid Google token: {e}")

        google_user_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', 'User')
        picture = idinfo.get('picture', None)

        db = get_database()
        
        user_data = {
            "user_id": google_user_id,
            "email": email,
            "name": name,
            "picture": picture
        }

        # 2. Upsert (update if exists, insert if not)
        await db.users.update_one(
            {"user_id": google_user_id},
            {"$set": user_data},
            upsert=True
        )

        return UserResponse(**user_data)

    @staticmethod
    async def get_user(user_id: str):
        db = get_database()
        user = await db.users.find_one({"user_id": user_id})
        if user:
            return UserResponse(**user)
        return None
