from app.models.risk_engine import RiskEngine

def compute_risk(data):

    income = data.monthly_income
    savings = data.current_savings

    ratio = RiskEngine.calculate_savings_ratio(income, savings)
    score = RiskEngine.calculate_risk_score(income, savings)
    level = RiskEngine.get_risk_level(income, savings)

    return {
        "risk_score": score,
        "risk_level": level,
        "savings_ratio": round(ratio, 2)
    }
