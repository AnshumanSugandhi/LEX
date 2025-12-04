import os
from pathlib import Path
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process, LLM

# --- 1. LOAD ENV ---
current_file = Path(__file__).resolve()
backend_dir = current_file.parent.parent 
env_file_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_file_path)

groq_key = os.getenv("GROQ_API_KEY")
if not groq_key:
    raise ValueError("GROQ_API_KEY is missing!")

# --- 2. CONFIGURATION ---
os.environ["OPENAI_API_KEY"] = groq_key
os.environ["OPENAI_API_BASE"] = "https://api.groq.com/openai/v1"
os.environ["CREWAI_TELEMETRY_OPT_OUT"] = "true"

# --- 3. SETUP LLM (UPDATED MODEL) ---
court_llm = LLM(
    model="openai/llama-3.3-70b-versatile", # <--- UPDATED THIS LINE
    base_url="https://api.groq.com/openai/v1",
    api_key=groq_key
)

# --- 4. AGENTS ---
judge_agent = Agent(
    role='Presiding Judge',
    goal='Deliver a verdict based strictly on logic.',
    backstory="You are a strict, impartial judge.",
    llm=court_llm,
    verbose=True
)

opposition_agent = Agent(
    role='Defense Attorney',
    goal='Discredit the user argument.',
    backstory="You are a ruthless lawyer.",
    llm=court_llm,
    verbose=True
)

# --- 5. EXECUTION ---
def run_courtroom_turn(user_argument, case_context):
    print(f"DEBUG: Sending to Groq Llama-3.3 -> {user_argument}")
    
    task1 = Task(
        description=f"Prosecution (User) argues: '{user_argument}'. Context: '{case_context}'. Write a sharp legal rebuttal.",
        agent=opposition_agent,
        expected_output="A short rebuttal paragraph."
    )
    
    task2 = Task(
        description="Review the rebuttal. Give a final verdict (Sustained/Overruled).",
        agent=judge_agent,
        expected_output="Verdict: [RULING] - [REASON]"
    )

    crew = Crew(
        agents=[opposition_agent, judge_agent],
        tasks=[task1, task2],
        process=Process.sequential,
        verbose=True
    )
    
    result = crew.kickoff()
    return result.raw