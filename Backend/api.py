"""
API = a thin HTTP wrapper around the exact same graph.py you already built.

Nothing about state.py, nodes.py, or graph.py changes. This file just:
  1. Takes JSON from the frontend (destination, days, interests)
  2. Builds the initial state (same shape as main.py's CLI version)
  3. Runs app.invoke(...) - same call main.py makes
  4. Returns the final state as JSON

Run with:  uvicorn api:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from graph import build_graph

app = FastAPI(title="LangGraph Trip Planner API")

# Allows the React dev server (localhost:5173) to call this API.
# In a real deployment you'd restrict this to your actual frontend's URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

graph_app = build_graph()  # compiled once, reused across requests


class TripRequest(BaseModel):
    destination: str
    days: int
    interests: list[str]


@app.post("/api/plan")
def plan_trip(req: TripRequest):
    initial_state = {
        "destination": req.destination,
        "days": req.days,
        "interests": req.interests,
        "resolved_location": "",
        "research": "",
        "itinerary": "",
        "feedback": "",
        "is_approved": False,
        "revision_count": 0,
        "budget_estimate": "",
    }

    final_state = graph_app.invoke(initial_state)
    return final_state


@app.get("/api/health")
def health():
    return {"status": "ok"}