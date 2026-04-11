import os
from app.database import get_database
from datetime import datetime
from bson import ObjectId
import smtplib
from email.mime.text import MIMEText
import asyncio

def send_alert_email(user_email: str, score: int, alerts: list):
    sender_email = os.getenv("EMAIL_SENDER", "your_email@gmail.com")
    sender_password = os.getenv("EMAIL_PASSWORD", "app_password")

    alert_text = "\n".join([f"- {a}" for a in alerts])
    body = f"Hello,\n\nYour financial risk score has dropped to {score}/100 and is now considered HIGH RISK.\n\nActive Alerts:\n{alert_text}\n\nPlease review your dashboard and consider adjusting your budget.\n\nRegards,\nYour Financial AI Advisor"

    msg = MIMEText(body)
    msg['Subject'] = "Critical Financial Risk Alert"
    msg['From'] = sender_email
    msg['To'] = user_email

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
        print(f"Risk alert email sent to {user_email}")
    except Exception as e:
        print(f"Failed to send email to {user_email}: {e}")

async def compute_risk(user_id: str):
    db = get_database()

    # ✅ 1. Check user exists
    try:
        user = await db["user"].find_one({"_id": ObjectId(user_id)})
    except:
        user = await db["user"].find_one({"_id": user_id})

    if not user:
        return {"error": "User not found"}

    # ✅ 2. Get finance data
    finance = await db["finance"].find_one({"user_id": user_id})

    # 🔥 IF finance NOT FOUND → calculate from transactions
    if not finance:
        transactions = await db["transactions"].find({"user_id": user_id}).to_list(100)

        if not transactions:
            return {"error": "No transactions found"}

        income = user.get("monthly_income", 0)

        expenses = sum(t["amount"] for t in transactions if t.get("type") == "expense")
        savings = income - expenses

    else:
        income = finance.get("monthly_income", 0)
        expenses = finance.get("total_expenses", 0)
        savings = finance.get("monthly_savings", 0)

    alerts = []

    expense_ratio = expenses / income if income else 0
    savings_ratio = savings / income if income else 0

  
    if expense_ratio > 0.6:
        alerts.append("Overspending detected")
    elif expense_ratio >= 0.4:
        alerts.append("Moderate spending warnings")

   
    if savings_ratio <= 0.25:
        alerts.append("Low savings rate")
    elif savings_ratio <= 0.4:
        alerts.append("savings below recommended level")

   
    months_to_risk = None


    if savings > 0 and expenses > savings:
        months_to_risk = int(savings / (expenses - savings))
        if months_to_risk < 3:
            alerts.append(f"Risk of running out of funds in {months_to_risk} months")


    score = 100

    if expense_ratio > 0.8:
        score -= 30
    if savings_ratio < 0.2:
        score -= 30
    if months_to_risk and months_to_risk < 3:
        score -= 20

    score = max(score, 0)

  
    if score < 40:
        level = "High"
        user_email = user.get("email")
        # Trigger email alert for high risk score
        if user_email:
            asyncio.create_task(asyncio.to_thread(send_alert_email, user_email, score, alerts))
    elif score < 70:
        level = "Medium"
    else:
        level = "Low"

    result = {
        "user_id": user_id,
        "risk_level": level,
        "score": score,
        "alerts": alerts,
        "metrics": {
            "expense_ratio": round(expense_ratio, 2),
            "savings_ratio": round(savings_ratio, 2)
        },
        "prediction": {
            "months_to_risk": months_to_risk
        },
        "updated_at": datetime.now().strftime("%Y-%m-%d")
    }

    # 💾 Save
    await db["risk_scores"].update_one(
        {"user_id": user_id},
        {"$set": result},
        upsert=True
    )

    return result