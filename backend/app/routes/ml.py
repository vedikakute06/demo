from fastapi import APIRouter, HTTPException
from app.schemas.ml import WhatIfInput
from app.ml.prediction import predict_what_if_from_values
from app.database import get_database
from datetime import datetime, timezone

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.post("/predict-what-if")
async def what_if_prediction(data: WhatIfInput):
    db = get_database()
    
    # First check if user exists
    from bson import ObjectId
    try:
        user = await db["user"].find_one({"_id": ObjectId(data.user_id)})
    except Exception:
        user = await db["user"].find_one({"_id": data.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="No such user exists")
    
    # Fetch financial data from the finance collection
    finance_doc = await db["finance"].find_one({"user_id": data.user_id})
    if not finance_doc:
        raise HTTPException(status_code=404, detail="No financial data found for this user")
    
    income = finance_doc.get("monthly_income", 0)
    expense = finance_doc.get("total_expenses", 0)
    saving = finance_doc.get("monthly_savings", 0)
    
    prediction = predict_what_if_from_values(income, expense, saving, data.purchase_cost, data.time)
    
    document = {
        "user_id": data.user_id,
        "income": income,
        "expense": expense,
        "saving": saving,
        "purchase_cost": data.purchase_cost,
        "time": data.time,
        "prediction": prediction,
        "created_at": datetime.now(timezone.utc)
    }
    await db["simulations"].update_one(
        {"user_id": data.user_id},
        {"$set": document},
        upsert=True
    )
    
    return {
        "prediction": prediction,
        "input_used": {
            "income": income,
            "expense": expense,
            "saving": saving,
            "purchase_cost": data.purchase_cost,
            "time": data.time
        },
        "saved_to_db": True
    }

@router.get("/predict-what-if/{user_id}")
async def get_what_if_simulations(user_id: str):
    db = get_database()
    cursor = db["simulations"].find({"user_id": user_id})
    simulations = await cursor.to_list(length=100)
    
    for sim in simulations:
        sim["_id"] = str(sim["_id"])
        
    return {"simulations": simulations}
