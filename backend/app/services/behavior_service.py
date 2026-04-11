from app.database import get_database
from app.ml.behavior_prediction import predict_behavior_from_transactions
from datetime import datetime, timezone

# Category mapping (same as your route)
CATEGORY_MAP = {
    "food": 0,
    "shopping": 1,
    "bills": 2,
    "travel": 3,
    "entertainment": 4,
    "rent": 2,
    "others": 4,
}

async def analyze_user_behavior(user_id: str):
    db = get_database()

    # ✅ Check user exists
    from bson import ObjectId
    try:
        user = await db["user"].find_one({"_id": ObjectId(user_id)})
    except:
        user = await db["user"].find_one({"_id": user_id})

    if not user:
        return {"error": "No such user exists"}

    # ✅ Fetch transactions
    cursor = db["transactions"].find({"user_id": user_id})
    raw_transactions = await cursor.to_list(length=100)

    if not raw_transactions:
        return {"error": "No transactions found"}

    # ✅ Convert to ML format
    transactions = []
    for t in raw_transactions:
        transactions.append({
            "amount": t.get("amount", 0),
            "category": CATEGORY_MAP.get(t.get("category", "others"), 4),
            "is_weekend": 1 if t.get("is_weekend", False) else 0,
            "hour": t.get("hour", 12),
        })

    # ✅ ML Prediction
    result = predict_behavior_from_transactions(transactions)

    # ✅ Save to MongoDB
    document = {
        "user_id": user_id,
        "cluster": result["cluster"],
        "insights": result["insights"],
        "confidence": result["confidence"],
        "updated_at": datetime.now(timezone.utc)
    }

    await db["behaviour_insights"].update_one(
        {"user_id": user_id},
        {"$set": document},
        upsert=True
    )

    return result