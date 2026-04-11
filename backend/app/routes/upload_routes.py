from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.upload_service import UploadService

router = APIRouter(
    prefix="/upload",
    tags=["CSV Upload"]
)


@router.post("/transactions")
async def upload_transactions(
    user_id: str,
    file: UploadFile = File(...)
):

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")

    result = await UploadService.upload_transactions(user_id, file)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result