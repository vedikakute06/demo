from fastapi import APIRouter, Depends
from app.database import get_database
from app.services.whatif_service import predict_what_if_from_values

router = APIRouter(prefix="/whatif", tags=["What-If Simulator"])


@router.post("/simulate")
async def simulate(data: dict, db=Depends(get_database)):

    user_id = data["user_id"]
    purchase_amount = data["purchase_amount"]
    months = data["months"]

    finance = await db["finance"].find_one({"user_id": user_id})

    if finance is None:
        return {"error": "Finance data not found"}

    income = finance["monthly_income"]
    expense = finance["total_expenses"]
    saving = finance["monthly_savings"]

    result = predict_what_if_from_values(
        income,
        expense,
        saving,
        purchase_amount,
        months
    )

    return result