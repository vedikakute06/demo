import pickle
import numpy as np
import os

# Get the directory of the current file (app/ml)
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "what_if_model.pkl")

# Load the model at startup
try:
    with open(model_path, 'rb') as f:
        what_if_model = pickle.load(f)
except Exception as e:
    print("Error loading model:", e)
    what_if_model = None

def predict():
    # Placeholder for AI/ML inference logic
    return {"prediction": "success"}

def generate_ai_message(decision, future_savings):
    if decision == "Not Recommended ❌":
        return "This purchase may lead to financial instability. Consider postponing it."

    elif decision == "Risky ⚠️":
        return f"This purchase is risky. Your savings may drop significantly, but you could recover to ₹{future_savings:.2f} over time."

    else:
        return f"This purchase looks safe. You are expected to maintain healthy savings of around ₹{future_savings:.2f}."

def predict_what_if(data):
    input_features = np.array([[ 
        data.income, 
        data.expense, 
        data.saving, 
        data.purchase_cost, 
        data.time
    ]])

    pred = what_if_model.predict(input_features)
    score = float(pred[0])  # assume model gives financial impact score

    # 💡 Basic financial calculations
    remaining_savings = data.saving - data.purchase_cost
    monthly_savings = data.income - data.expense

    future_savings = remaining_savings + (monthly_savings * data.time)
    # 📊 Decision Logic
    if remaining_savings < 0:
        decision = "Not Recommended ❌"
        reason = "Purchase exceeds your current savings"
    elif remaining_savings < (data.saving * 0.3):
        decision = "Risky ⚠️"
        reason = "Savings will reduce significantly"
    else:
        decision = "Safe to Buy ✅"
        reason = "You still maintain healthy savings"

    # 📈 Return detailed response
    return {
        "model_score": score,
        "decision": decision,
        "remaining_savings": remaining_savings,
        "monthly_savings": monthly_savings,
        "future_savings": future_savings,
        "insight": reason,
        "ai_message": generate_ai_message(decision, future_savings)
    }
