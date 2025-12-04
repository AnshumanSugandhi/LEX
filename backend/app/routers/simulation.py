from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agents import run_courtroom_turn

router = APIRouter(tags=["simulation"])

class ChatRequest(BaseModel):
    user_argument: str
    case_context: str

@router.post("/simulation/turn")
async def run_turn(request: ChatRequest):
    try:
        # Call the CrewAI function from agents.py
        result = run_courtroom_turn(request.user_argument, request.case_context)
        return {"response": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))