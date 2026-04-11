from fastapi import APIRouter, HTTPException
from app.database import get_database
from bson import ObjectId
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/ai", tags=["AI Insights"])

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


@router.post("/insights/{user_id}")
async def generate_insights(user_id: str):
    db = get_database()

    # ✅ 1. Get user
    try:
        user = await db["user"].find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = await db["user"].find_one({"_id": user_id})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ 2. Get transactions
    transactions = await db["transactions"].find(
        {"user_id": user_id}
    ).to_list(length=200)

    # ✅ 3. Get finance data
    finance = await db["finance"].find_one({"user_id": user_id})

    # ✅ 4. Get financial health
    health = await db["financial_health"].find_one({"user_id": user_id})

    # ✅ 5. Get goals
    goals = await db["goals"].find({"user_id": user_id}).to_list(length=20)

    # 📊 Build summary — income from user profile first, then finance, then transactions
    income = 0
    expenses = 0
    category_totals = {}

    # User profile is the primary source for income
    user_income = user.get("monthly_income", 0) or 0

    if finance:
        finance_income = finance.get("monthly_income", 0) or 0
        income = user_income if user_income > 0 else finance_income
        expenses = finance.get("total_expenses", 0) or 0
    elif transactions:
        tx_income = sum(t["amount"] for t in transactions if t.get("type") == "income")
        income = user_income if user_income > 0 else tx_income
        expenses = sum(t["amount"] for t in transactions if t.get("type") == "expense")
    else:
        income = user_income

    for t in transactions:
        if t.get("type") == "expense":
            cat = t.get("category", "Other")
            category_totals[cat] = category_totals.get(cat, 0) + t.get("amount", 0)

    savings = income - expenses
    health_score = health.get("score", 0) if health else 0

    goal_summary = ""
    for g in goals:
        saved = g.get("current_saved", 0)
        target = g.get("target_amount", 0)
        goal_summary += f"- {g.get('title', g.get('goal_type', 'Goal'))}: ₹{saved:,.0f} / ₹{target:,.0f} (deadline: {g.get('deadline', 'N/A')})\n"

    category_summary = "\n".join(
        f"- {cat}: ₹{amt:,.0f}" for cat, amt in sorted(
            category_totals.items(), key=lambda x: x[1], reverse=True
        )
    )

    prompt = f"""You are a personal finance advisor for an Indian user. Analyze their financial data and give exactly 4 short, actionable insights. Each insight should be 1-2 sentences max. Be specific with numbers from their data. Use ₹ for currency.

User Profile:
- Age: {user.get('age', 'N/A')}
- Profession: {user.get('profession', 'N/A')}
- Monthly Income: ₹{income:,.0f}
- Total Expenses: ₹{expenses:,.0f}
- Savings: ₹{savings:,.0f}
- Savings Rate: {(savings/income*100) if income > 0 else 0:.1f}%
- Financial Health Score: {health_score}/100

Spending by Category:
{category_summary if category_summary else "No spending data yet."}

Goals:
{goal_summary if goal_summary else "No active goals."}

Give exactly 4 insights as a JSON array of strings, like:
["insight 1", "insight 2", "insight 3", "insight 4"]

Only return the JSON array, nothing else."""

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a smart personal finance advisor. Respond only with a JSON array of insight strings."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=500,
        )

        response_text = chat_completion.choices[0].message.content.strip()

        # Parse the JSON array from the response
        import json
        try:
            insights = json.loads(response_text)
            if not isinstance(insights, list):
                insights = [response_text]
        except json.JSONDecodeError:
            # If response is not valid JSON, split by newlines
            insights = [line.strip().lstrip("- ").lstrip("0123456789.") .strip()
                       for line in response_text.split("\n") if line.strip()]

        return {"insights": insights[:5]}

    except Exception as e:
        print(f"Groq API error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate insights: {str(e)}"
        )
