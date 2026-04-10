from app.database import get_database
from app.schemas.goal_schema import GoalCreate, GoalResponse
import uuid
import datetime

class GoalService:
    @staticmethod
    def calculate_progress(current_saved: float, target_amount: float) -> float:
        if target_amount <= 0:
            return 100.0
        return min((current_saved / target_amount) * 100, 100.0)

    @staticmethod
    def calculate_monthly_required(target_amount: float, current_saved: float, timeline_months: int) -> float:
        if timeline_months <= 0:
            return 0.0
        remaining = max(target_amount - current_saved, 0)
        return remaining / timeline_months

    @staticmethod
    async def create_goal(goal_data: GoalCreate) -> GoalResponse:
        db = get_database()
        goal_id = str(uuid.uuid4())
        now = datetime.datetime.utcnow()
        
        monthly_required = GoalService.calculate_monthly_required(
            goal_data.target_amount, 
            goal_data.current_saved, 
            goal_data.timeline_months
        )
        progress = GoalService.calculate_progress(
            goal_data.current_saved, 
            goal_data.target_amount
        )

        goal_dict = goal_data.dict()
        goal_dict.update({
            "goal_id": goal_id,
            "status": "active",
            "monthly_required": monthly_required,
            "progress": progress,
            "created_at": now,
            "updated_at": now
        })

        await db.goals.insert_one(goal_dict)
        return GoalResponse(**goal_dict)

    @staticmethod
    async def get_user_goals(user_id: str) -> list[GoalResponse]:
        db = get_database()
        cursor = db.goals.find({"user_id": user_id})
        goals = []
        async for doc in cursor:
            # Recompute on the fly or just use stored values. Standard is calculating on the fly if progress can change externally, but here we just return DB state
            # Progress can be recomputed to ensure accuracy
            doc['progress'] = GoalService.calculate_progress(doc['current_saved'], doc['target_amount'])
            doc['monthly_required'] = GoalService.calculate_monthly_required(doc['target_amount'], doc['current_saved'], doc['timeline_months'])
            goals.append(GoalResponse(**doc))
        return goals

    @staticmethod
    async def update_goal_savings(goal_id: str, amount: float):
        db = get_database()
        
        # Need to fetch the goal first to add to current_saved and recompute required
        print(f"Goal ID for update: {goal_id}")
        goal = await db.goals.find_one({"goal_id": goal_id})
        print(f"Goal found: {goal}")
        
        if not goal:
            raise ValueError("Goal not found")

        new_saved = goal["current_saved"] + amount
        
        now = datetime.datetime.utcnow()
        monthly_req = GoalService.calculate_monthly_required(
            goal["target_amount"], 
            new_saved, 
            goal["timeline_months"]
        )
        progress = GoalService.calculate_progress(
            new_saved, 
            goal["target_amount"]
        )
        
        # Update status if completed
        status = "completed" if new_saved >= goal["target_amount"] else "active"

        await db.goals.update_one(
            {"goal_id": goal_id},
            {"$set": {
                "current_saved": new_saved,
                "monthly_required": monthly_req,
                "progress": progress,
                "status": status,
                "updated_at": now
            }}
        )

        # Return updated goal
        updated_goal = await db.goals.find_one({"goal_id": goal_id})
        return GoalResponse(**updated_goal)
