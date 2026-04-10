from app.database import get_database
from app.schemas.financial_health_schema import FinancialHealthResponse, FinancialHealthBreakdown
import datetime

class FinancialHealthService:

    @staticmethod
    def _get_mock_user_financial_data(user_id: str):
        # MOCK DATA since we don't have these in UserService yet
        # Returning defaults to allow calculation
        return {
            "income": 100000,
            "total_spending": 60000,
            "high_spend_ratio": 0.2, # 20%
            "emergency_fund": 180000, # 3x of monthly_expense (60k)
            "monthly_expense": 60000
        }

    @staticmethod
    def calculate_health_score(user_id: str) -> dict:
        data = FinancialHealthService._get_mock_user_financial_data(user_id)
        
        income = data["income"]
        total_spending = data["total_spending"]
        high_spend_ratio = data["high_spend_ratio"]
        emergency_fund = data["emergency_fund"]
        monthly_expense = data["monthly_expense"]

        # 1. Savings Score (40%)
        savings = income - total_spending
        savings_ratio = savings / income if income > 0 else 0
        score_savings = min(savings_ratio * 100, 100)

        # 2. Spending Score (30%)
        score_spending = max(100 - (high_spend_ratio * 100), 0)

        # 3. Risk Score (30%)
        if emergency_fund >= 6 * monthly_expense:
            risk_score = 100
        elif emergency_fund >= 3 * monthly_expense:
            risk_score = 70
        else:
            risk_score = 40

        # Final Score
        final_score = (
            0.4 * score_savings +
            0.3 * score_spending +
            0.3 * risk_score
        )

        return {
            "score": round(final_score, 2),
            "savings_score": round(score_savings, 2),
            "spending_score": round(score_spending, 2),
            "risk_score": round(risk_score, 2)
        }

    @staticmethod
    def _evaluate_status(score: float) -> str:
        if score >= 80:
            return "excellent"
        elif score >= 50:
            return "good"
        else:
            return "poor"

    @staticmethod
    async def process_financial_health(user_id: str) -> FinancialHealthResponse:
        db = get_database()
        
        calc_result = FinancialHealthService.calculate_health_score(user_id)
        status = FinancialHealthService._evaluate_status(calc_result["score"])
        now = datetime.datetime.utcnow()

        health_data = {
            "user_id": user_id,
            "score": calc_result["score"],
            "breakdown": {
                "savings_score": calc_result["savings_score"],
                "spending_score": calc_result["spending_score"],
                "risk_score": calc_result["risk_score"]
            },
            "status": status,
            "updated_at": now
        }

        # Upsert logic
        await db.financial_health.update_one(
            {"user_id": user_id},
            {"$set": health_data},
            upsert=True
        )

        return FinancialHealthResponse(**health_data)
