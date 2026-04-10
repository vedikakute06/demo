import pickle
import numpy as np
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "behavior_model.pkl")

# Load model at startup
with open(model_path, 'rb') as f:
    behavior_model = pickle.load(f)

def extract_features(transactions):
    total = sum(t["amount"] for t in transactions)
    avg = total / len(transactions) if transactions else 0
    weekend_ratio = sum(t["is_weekend"] for t in transactions) / len(transactions) if transactions else 0
    high_spend_count = sum(1 for t in transactions if t["amount"] > 2000)
    high_spend_ratio = high_spend_count / len(transactions) if transactions else 0
    unique_categories = len(set(t["category"] for t in transactions))
    return [total, avg, weekend_ratio, high_spend_ratio, unique_categories]

def predict_behavior(data):
    transactions = [t.model_dump() for t in data.transactions]
    features = extract_features(transactions)
    features_array = np.array([features])
    
    prediction = behavior_model.predict(features_array)[0]
    proba = behavior_model.predict_proba(features_array)[0]
    confidence = float(max(proba))
    
    if prediction == 0:
        behavior = "Normal Spending ✅"
        cluster = "balanced"
    elif prediction == 1:
        behavior = "Impulse Spending ⚠️"
        cluster = "impulse"
    else:
        behavior = "High-Risk Spending 🔴"
        cluster = "high_risk"
        
    total, avg, weekend_ratio, high_spend_ratio, unique_categories = features
    
    insights = []
    if weekend_ratio > 0.5:
        insights.append("You tend to spend more on weekends")
    if high_spend_ratio > 0.4:
        insights.append("You frequently make high-value purchases")
    if avg < 500:
        insights.append("Your spending is controlled")
    if unique_categories > 3:
        insights.append("You spend across many categories")
        
    return {
        "behavior": behavior,
        "cluster": cluster,
        "confidence": confidence,
        "prediction_class": int(prediction),
        "insights": insights,
        "features_extracted": {
            "total_spent": total,
            "average_spent": avg,
            "weekend_ratio": weekend_ratio,
            "high_spend_ratio": high_spend_ratio,
            "unique_categories": unique_categories
        }
    }
