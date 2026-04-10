import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import pickle
import os

np.random.seed(42)

def generate_user_data():
    num_transactions = np.random.randint(5, 30)
    transactions = []
    for _ in range(num_transactions):
        amount = np.random.randint(50, 5000)
        category = np.random.choice([0,1,2,3,4])
        is_weekend = np.random.choice([0,1])
        hour = np.random.randint(0, 24)
        transactions.append({
            "amount": amount,
            "category": category,
            "is_weekend": is_weekend,
            "hour": hour
        })
    return transactions

def extract_features(transactions):
    total = sum(t["amount"] for t in transactions)
    avg = total / len(transactions) if transactions else 0
    weekend_ratio = sum(t["is_weekend"] for t in transactions) / len(transactions) if transactions else 0
    high_spend_count = sum(1 for t in transactions if t["amount"] > 2000)
    high_spend_ratio = high_spend_count / len(transactions) if transactions else 0
    unique_categories = len(set(t["category"] for t in transactions))
    return [total, avg, weekend_ratio, high_spend_ratio, unique_categories]

def label_user(features):
    total, avg, weekend_ratio, high_spend_ratio, unique_categories = features
    if high_spend_ratio > 0.6 and weekend_ratio > 0.5:
        return 2  # High Risk
    elif avg > 1500 or high_spend_ratio > 0.4:
        return 1  # Impulse
    else:
        return 0  # Normal

X, y = [], []
for _ in range(1000):
    transactions = generate_user_data()
    features = extract_features(transactions)
    X.append(features)
    y.append(label_user(features))

X = np.array(X)
y = np.array(y)

model = RandomForestClassifier(n_estimators=100)
model.fit(X, y)

# Save the model
model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "behavior_model.pkl")
with open(model_path, "wb") as f:
    pickle.dump(model, f)

print(f"Model trained and saved at {model_path}")
