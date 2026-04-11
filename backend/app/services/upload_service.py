import os
import pandas as pd
from datetime import datetime
from io import BytesIO
from bson import ObjectId
from app.database import get_database

class UploadService:

    @staticmethod
    async def upload_transactions(user_id: str, file):
        db = get_database()

        # 📄 Read CSV
        contents = await file.read()
        df = pd.read_csv(BytesIO(contents))

        if df.empty:
            return {"error": "CSV is empty"}

        # 🧹 Normalize headers (strip spaces, make lowercase)
        df.columns = df.columns.str.strip().str.lower()

        transactions = []

        for _, row in df.iterrows():
            # Safely get values, fallback to reasonable defaults on error
            desc = row.get("description", row.get("merchant_name", row.get("merchant", "")))
            amount = float(row.get("amount", 0))
            category = row.get("category", "Other")
            date_str = str(row.get("date", datetime.utcnow().strftime("%Y-%m-%d")))
            payment_mode = row.get("payment_method", row.get("payment_mode", "upi"))
            note = row.get("notes", row.get("note", ""))
            tx_type = row.get("type", "expense")
            
            try:
                dt = pd.to_datetime(date_str, format='mixed', dayfirst=True)
                hour = dt.hour
                date_fmt = dt.strftime("%Y-%m-%d")
            except:
                try:
                    dt = pd.to_datetime(date_str)
                    hour = dt.hour
                    date_fmt = dt.strftime("%Y-%m-%d")
                except:
                    hour = datetime.now().hour
                    date_fmt = datetime.utcnow().strftime("%Y-%m-%d")

            transaction = {
                "user_id": user_id,
                "amount": amount,
                "category": category,
                "description": desc,
                "date": date_fmt,
                "payment_mode": payment_mode,
                "note": note,
                "type": tx_type,
                "hour": hour,
                "is_weekend": False, # Basic default since ML is removed
                "created_at": datetime.utcnow()
            }
            transactions.append(transaction)

        if not transactions:
             return {"error": "No valid transactions found in CSV."}

        # 💾 Insert into DB
        result = await db["transactions"].insert_many(transactions)

        return {
            "message": "CSV uploaded successfully",
            "inserted_count": len(result.inserted_ids),
            "user_id": user_id
        }