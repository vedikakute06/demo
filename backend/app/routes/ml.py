from fastapi import APIRouter
from app.schemas.ml import WhatIfInput
from app.ml.prediction import predict_what_if

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.post("/predict-what-if")
async def what_if_prediction(data: WhatIfInput):
    prediction = predict_what_if(data)
    return {"prediction": prediction}
