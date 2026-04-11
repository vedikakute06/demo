from fastapi import APIRouter, Depends
from datetime import datetime
from app.database import get_database
from app.schemas.transaction_schema import Transaction

router = APIRouter(prefix="/transactions", tags=["Transactions"])

import traceback

@router.post("/add")
async def add_transaction(txn: Transaction, db = Depends(get_database)):
    try:
        data = txn.model_dump()

        from datetime import datetime

        if not data.get("date"):
            data["date"] = datetime.now().strftime("%Y-%m-%d")

        data["created_at"] = datetime.now().strftime("%Y-%m-%d")

        result = await db["transactions"].insert_one(data)

        return {
            "message": "Transaction added",
            "id": str(result.inserted_id)
        }

    except Exception as e:
        print("🔥 ERROR:", e)
        traceback.print_exc()
        return {"error": str(e)}