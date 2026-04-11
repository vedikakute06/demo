from app.database import get_database
from app.schemas.financial_health_schema import FinancialHealthResponse
import datetime


class FinancialHealthService:

    @staticmethod
    async def _get_user_financial_data(user_id: str):
        db = get_database()

        transactions = await db["transactions"].find(
            {"user_id": user_id}
        ).to_list(length=1000)

        if not transactions:
            return None

        income = 0
        expense = 0
        high_spend_count = 0

        for t in transactions:
            if t["type"] == "income":
                income += t["amount"]
            else:
                expense += t["amount"]

                if t["amount"] > 5000:
                    high_spend_count += 1

        total_txns = len(transactions)

        high_spend_ratio = (
            high_spend_count / total_txns if total_txns > 0 else 0
        )

        savings = income - expense
        emergency_fund = max(savings, 0)
        monthly_expense = expense

        return {
            "income": income,
            "expense": expense,
            "high_spend_ratio": high_spend_ratio,
            "emergency_fund": emergency_fund,
            "monthly_expense": monthly_expense
        }

    @staticmethod
    def calculate_health_score(data: dict):

        income = data["income"]
        expense = data["expense"]
        high_spend_ratio = data["high_spend_ratio"]
        emergency_fund = data["emergency_fund"]
        monthly_expense = data["monthly_expense"]

        # 🔹 Savings Score (40%)
        savings = income - expense
        savings_ratio = savings / income if income > 0 else 0
        savings_score = min(savings_ratio * 100, 100)

        # 🔹 Spending Score (30%)
        spending_score = max(100 - (high_spend_ratio * 100), 0)

        # 🔹 Risk Score (30%)
        if emergency_fund >= 6 * monthly_expense:
            risk_score = 100
        elif emergency_fund >= 3 * monthly_expense:
            risk_score = 70
        else:
            risk_score = 40

        # 🔹 Final Score
        final_score = (
            0.4 * savings_score +
            0.3 * spending_score +
            0.3 * risk_score
        )

        return {
            "score": round(final_score, 2),
            "savings_score": round(savings_score, 2),
            "spending_score": round(spending_score, 2),
            "risk_score": round(risk_score, 2)
        }

    @staticmethod
    def _evaluate_status(score: float):
        if score >= 80:
            return "excellent"
        elif score >= 50:
            return "good"
        else:
            return "poor"

    @staticmethod
    async def process_financial_health(user_id: str):
        db = get_database()

        data = await FinancialHealthService._get_user_financial_data(user_id)

        # ✅ HANDLE NO DATA (FIXED)
        if data is None:
            health_data = {
                "user_id": user_id,
                "score": 0,
                "breakdown": {
                    "savings_score": 0,
                    "spending_score": 0,
                    "risk_score": 0
                },
                "status": "poor",  # must match schema
                "created_at": datetime.datetime.utcnow()
            }

            await db["financial_health"].update_one(
                {"user_id": user_id},
                {"$set": health_data},
                upsert=True
            )

            return FinancialHealthResponse(**health_data)

        # ✅ NORMAL FLOW
        result = FinancialHealthService.calculate_health_score(data)
        status = FinancialHealthService._evaluate_status(result["score"])

        now = datetime.datetime.utcnow()

        health_data = {
            "user_id": user_id,
            "score": result["score"],
            "breakdown": {
                "savings_score": result["savings_score"],
                "spending_score": result["spending_score"],
                "risk_score": result["risk_score"]
            },
            "status": status,
            "created_at": now
        }

        # ✅ UPSERT
        await db["financial_health"].update_one(
            {"user_id": user_id},
            {"$set": health_data},
            upsert=True
        )

        return FinancialHealthResponse(**health_data)