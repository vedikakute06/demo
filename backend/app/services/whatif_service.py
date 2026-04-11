import pickle
import numpy as np
import os

# Load model
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "..", "ml", "what_if_model.pkl")

try:
    with open(model_path, 'rb') as f:
        what_if_model = pickle.load(f)
except Exception as e:
    print("Error loading model:", e)
    what_if_model = None


def generate_ai_message(decision, future_savings):
    if decision == "Not Recommended":
        return "This purchase may lead to financial instability. Consider postponing it."

    elif decision == "Risky":
        return f"This purchase is risky. Your savings may drop significantly, but you could recover to ₹{future_savings:.2f} over time."

    else:
        return f"This purchase looks safe. You are expected to maintain healthy savings of around ₹{future_savings:.2f}."


def predict_what_if_from_values(income, expense, saving, purchase_cost, time):

    # Correct feature order
    input_features = np.array([[income, expense, saving, purchase_cost, time]])

    score = 0
    if what_if_model:
        pred = what_if_model.predict(input_features)
        score = float(pred[0])

    # Financial calculations
    remaining_savings = saving - purchase_cost
    monthly_savings = income - expense
    future_savings = remaining_savings + (monthly_savings * time)

    # Decision logic
    if remaining_savings < 0:
        decision = "Not Recommended"
        reason = "Purchase exceeds your current savings"

    elif remaining_savings < (saving * 0.3):
        decision = "Risky"
        reason = "Savings will reduce significantly"

    else:
        decision = "Safe to Buy"
        reason = "You still maintain healthy savings"

    return {
        "model_score": score,
        "decision": decision,
        "remaining_savings": remaining_savings,
        "monthly_savings": monthly_savings,
        "future_savings": future_savings,
        "insight": reason,
        "ai_message": generate_ai_message(decision, future_savings)
    }