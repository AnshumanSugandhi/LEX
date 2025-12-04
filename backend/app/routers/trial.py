from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["trial"])

class TrialStatus(BaseModel):
    user_id: str
    has_used_trial: bool
    is_premium: bool

class UseTrialRequest(BaseModel):
    user_id: str

# --- MOCK IMPLEMENTATION (No Database Required) ---
@router.get("/trial-status/{user_id}", response_model=TrialStatus)
async def get_trial_status(user_id: str) -> TrialStatus:
    # Always return that the user has a fresh trial available
    return TrialStatus(
        user_id=user_id, 
        has_used_trial=False, 
        is_premium=True # Set to True to bypass limits for testing
    )

@router.post("/use-trial", response_model=TrialStatus)
async def use_trial(payload: UseTrialRequest) -> TrialStatus:
    return TrialStatus(
        user_id=payload.user_id, 
        has_used_trial=True, 
        is_premium=True
    )