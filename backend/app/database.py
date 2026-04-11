import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

load_dotenv()  # 🔥 IMPORTANT

MONGO_URL = os.getenv("MONGO_URL")
DATABASE_NAME = "fintech_db"

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def connect_to_mongo():
    try:
        db.client = AsyncIOMotorClient(MONGO_URL)
        logging.info(f"✅ Connected to MongoDB")
    except Exception as e:
        logging.error(f"❌ MongoDB connection error: {e}")

async def close_mongo_connection():
    if db.client:
        db.client.close()
        logging.info("🔌 MongoDB connection closed")

def get_database():
    if db.client is None:
        raise Exception("Database not initialized")
    return db.client[DATABASE_NAME]