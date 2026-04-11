from app.database import get_database
from app.schemas.finance_schema import FinanceResponse
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
            if t["type"] == "income":
                income += t["amount"]

            elif t["type"] == "expense":
                if t["amount"] > 3000:
                    fixed_expenses += t["amount"]
                else:
                    variable_expenses += t["amount"]

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

        summary = await FinanceService._get_transaction_summary(user_id)

        now = datetime.datetime.utcnow()

        # ✅ DEFAULT (NO DATA)
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

        # ✅ FETCH EXISTING INVESTMENTS + LIABILITIES (if already stored)
        existing = await db["finance"].find_one({"user_id": user_id})

        if existing:
            investments = existing.get("investments", {})
            liabilities = existing.get("liabilities", {})
        else:
            investments = {}
            liabilities = {}

        # fallback defaults
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