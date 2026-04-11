from app.database import get_database
from app.schemas.finance_schema import FinanceResponse
from bson import ObjectId
from fastapi import HTTPException
import datetime


class FinanceService:

    @staticmethod
    async def _get_transaction_summary(user_id: str):
        db = get_database()

        transactions = await db["transactions"].find(
            {"user_id": user_id}
        ).to_list(length=1000)

        if not transactions:
            return None

        income = 0
        fixed_expenses = 0
        variable_expenses = 0

        for t in transactions:
            if t.get("type") == "income":
                income += t.get("amount", 0)

            elif t.get("type") == "expense":
                if t.get("amount", 0) > 3000:
                    fixed_expenses += t.get("amount", 0)
                else:
                    variable_expenses += t.get("amount", 0)

        total_expenses = fixed_expenses + variable_expenses
        savings = income - total_expenses

        savings_rate = (savings / income * 100) if income > 0 else 0

        return {
            "income": income,
            "fixed_expenses": fixed_expenses,
            "variable_expenses": variable_expenses,
            "total_expenses": total_expenses,
            "monthly_savings": savings,
            "savings_rate": round(savings_rate, 2)
        }

    @staticmethod
    def _evaluate_financial_status(savings_rate: float):
        if savings_rate >= 40:
            return "stable"
        elif savings_rate >= 20:
            return "warning"
        else:
            return "critical"

    @staticmethod
    async def process_finance(user_id: str):
        db = get_database()

        # ✅ 1. CHECK USER EXISTS (FIXED)
        user = None
        try:
            user = await db["user"].find_one({"_id": ObjectId(user_id)})
        except:
            user = await db["user"].find_one({"_id": user_id})

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # ✅ 2. GET TRANSACTION SUMMARY
        summary = await FinanceService._get_transaction_summary(user_id)

        now = datetime.datetime.utcnow()

        # =========================
        # CASE 1: NO TRANSACTIONS
        # =========================
        if summary is None:
            finance_data = {
                "user_id": user_id,
                "monthly_income": 0,
                "fixed_expenses": 0,
                "variable_expenses": 0,
                "total_expenses": 0,
                "monthly_savings": 0,
                "savings_rate": 0,
                "investments": {
                    "sip": 0,
                    "fd": 0,
                    "stocks": 0,
                    "mutual_funds": 0,
                    "total_investments": 0,
                    "net_worth": 0
                },
                "liabilities": {
                    "loan": 0,
                    "credit_card_due": 0
                },
                "financial_status": "critical",
                "last_updated": now
            }

            await db["finance"].update_one(
                {"user_id": user_id},
                {"$set": finance_data},
                upsert=True
            )

            return FinanceResponse(**finance_data)

        # =========================
        # CASE 2: HAS TRANSACTIONS
        # =========================

        existing = await db["finance"].find_one({"user_id": user_id})

        investments = existing.get("investments", {}) if existing else {}
        liabilities = existing.get("liabilities", {}) if existing else {}

        investments = {
            "sip": investments.get("sip", 5000),
            "fd": investments.get("fd", 20000),
            "stocks": investments.get("stocks", 15000),
            "mutual_funds": investments.get("mutual_funds", 10000),
            "total_investments": investments.get("total_investments", 50000),
            "net_worth": investments.get(
                "net_worth",
                summary["monthly_savings"] + 100000
            )
        }

        liabilities = {
            "loan": liabilities.get("loan", 30000),
            "credit_card_due": liabilities.get("credit_card_due", 5000)
        }

        status = FinanceService._evaluate_financial_status(
            summary["savings_rate"]
        )

        finance_data = {
            "user_id": user_id,
            "monthly_income": summary["income"],
            "fixed_expenses": summary["fixed_expenses"],
            "variable_expenses": summary["variable_expenses"],
            "total_expenses": summary["total_expenses"],
            "monthly_savings": summary["monthly_savings"],
            "savings_rate": summary["savings_rate"],
            "investments": investments,
            "liabilities": liabilities,
            "financial_status": status,
            "last_updated": now
        }

        await db["finance"].update_one(
            {"user_id": user_id},
            {"$set": finance_data},
            upsert=True
        )

        return FinanceResponse(**finance_data)