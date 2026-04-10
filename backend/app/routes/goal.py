from fastapi import APIRouter, BackgroundTasks, HTTPException
from typing import List
from app.schemas.goal_schema import GoalCreate, GoalResponse, GoalUpdateSavings
from app.services.goal_service import GoalService
from app.services.financial_health_service import FinancialHealthService

router = APIRouter(prefix="/goals", tags=["Goals"])

@router.post("/", response_model=GoalResponse)
async def create_goal(goal_data: GoalCreate, background_tasks: BackgroundTasks):
    new_goal = await GoalService.create_goal(goal_data)
    
    # Recalculate health score in background (as per instructions)
    background_tasks.add_task(FinancialHealthService.process_financial_health, goal_data.user_id)
    
    return new_goal

@router.get("/{user_id}", response_model=List[GoalResponse])
async def get_goals(user_id: str):
    return await GoalService.get_user_goals(user_id)

@router.put("/{goal_id}/add-saving", response_model=GoalResponse)
async def update_goal_savings(goal_id: str, data: GoalUpdateSavings, background_tasks: BackgroundTasks):
    try:
        updated_goal = await GoalService.update_goal_savings(goal_id, data.amount)
        
        # We need the user_id for the background task, the updated_goal contains it
        background_tasks.add_task(FinancialHealthService.process_financial_health, updated_goal.user_id)
        
        return updated_goal
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
