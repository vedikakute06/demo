from app.database import get_database
from datetime import datetime
from bson import ObjectId

async def generate_user_features(user_id: str):
    db = get_database()

    # ✅ Check user exists
    user = None
    if ObjectId.is_valid(user_id):
        user = await db["user"].find_one({"_id": ObjectId(user_id)})
    if not user:
        user = await db["user"].find_one({"_id": user_id})

    if not user:
        return {"error": "User not found"}

    # ✅ Fetch transactions
    transactions = await db["transactions"].find({"user_id": user_id}).to_list(100)

    if not transactions:
        return {"error": "No transactions found"}

    # 📊 Feature calculations
    total_spending = sum(t.get("amount", 0) for t in transactions)

    avg_spending = total_spending / len(transactions)

    weekend_count = sum(1 for t in transactions if t.get("is_weekend", False))
    weekend_ratio = weekend_count / len(transactions)

    high_spend_count = sum(1 for t in transactions if t.get("amount", 0) > 2000)
    high_spend_ratio = high_spend_count / len(transactions)

    unique_categories = len(set(t.get("category", "other") for t in transactions))

    # 📦 Final feature document
    feature_doc = {
        "user_id": user_id,
        "total_spending": round(total_spending, 2),
        "avg_spending": round(avg_spending, 2),
        "weekend_ratio": round(weekend_ratio, 2),
        "high_spend_ratio": round(high_spend_ratio, 2),
        "unique_categories": unique_categories,
        "last_updated": datetime.now().strftime("%Y-%m-%d")
    }

    # 💾 Save (update if exists)
    await db["user_feature"].update_one(
        {"user_id": user_id},
        {"$set": feature_doc},
        upsert=True
    )

    return feature_doc