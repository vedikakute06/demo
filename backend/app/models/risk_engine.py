class RiskEngine:
    @staticmethod
    def calculate_savings_ratio(income, savings):
        if income == 0:
            return 0
        return savings / income

    @staticmethod
    def calculate_risk_score(income, savings):
        ratio = RiskEngine.calculate_savings_ratio(income, savings)
        score = ratio * 100
        if score > 100:
            score = 100
        return round(score, 2)

    @staticmethod
    def get_risk_level(income, savings):
        ratio = RiskEngine.calculate_savings_ratio(income, savings)
        if ratio < 0.1:
            return "High Risk"
        elif ratio < 0.3:
            return "Medium Risk"
        else:
            return "Low Risk"
