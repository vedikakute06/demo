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

@router.get("/{user_id}")
async def get_transactions(user_id: str, db = Depends(get_database)):
    try:
        txns = await db["transactions"].find({"user_id": user_id}).sort("created_at", -1).to_list(100)
        for t in txns:
            t["_id"] = str(t["_id"])
        return txns
    except Exception as e:
        print("🔥 ERROR:", e)
        traceback.print_exc()
        return {"error": str(e)}