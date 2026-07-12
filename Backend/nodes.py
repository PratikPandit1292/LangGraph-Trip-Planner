"""
NODES = individual functions, each doing ONE job, each taking the state
in and returning a partial update.

There are 3 nodes here:
  1. research_node      -> uses a real tool (web search) to gather facts
  2. draft_itinerary_node -> uses Claude to write/revise the itinerary
  3. critique_node       -> uses Claude again, but as a critic, to decide
                            if the draft is good enough

Notice draft_itinerary_node and critique_node are the two nodes that
form a LOOP later in graph.py - that's the "agent revises its own work"
pattern.
"""

import requests
from duckduckgo_search import DDGS
from langchain_groq import ChatGroq
from state import TripState

MAX_REVISIONS = 2  # safety valve so the loop can't run forever

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.4)


def resolve_location_node(state: TripState) -> dict:
    """Tool node: no LLM, no API key. Resolves whatever the user typed
    into an unambiguous, fully-qualified place name using OpenStreetMap's
    free Nominatim geocoding service. This is what fixes the
    Manali/Manila mix-up generically, for ANY destination."""
    print(f"\n📍 Resolving location: {state['destination']}")

    response = requests.get(
        "https://nominatim.openstreetmap.org/search",
        params={"q": state["destination"], "format": "json", "limit": 1},
        headers={"User-Agent": "langgraph-trip-planner-learning-project"},
    )
    results = response.json()

    if results:
        resolved = results[0]["display_name"]
    else:
        resolved = state["destination"]  # fallback if lookup finds nothing

    print(f"   -> Resolved to: {resolved}")
    return {"resolved_location": resolved}


def research_node(state: TripState) -> dict:
    """Tool-use node: no LLM here, just a plain web search.
    Uses the RESOLVED location, not the raw typed input."""
    query = f"top attractions and things to do in {state['resolved_location']}"
    print(f"\n🔍 Researching: {query}")

    with DDGS() as ddgs:
        results = list(ddgs.text(query, max_results=5))

    snippets = "\n".join(f"- {r['title']}: {r['body']}" for r in results)
    return {"research": snippets}


def draft_itinerary_node(state: TripState) -> dict:
    """LLM node: writes a first draft, or revises using prior feedback."""
    revision_note = ""
    if state.get("feedback"):
        revision_note = (
            f"\n\nYour previous draft received this feedback - fix it:\n"
            f"{state['feedback']}"
        )

    prompt = f"""Create a {state['days']}-day travel itinerary for {state['destination']}.
Traveler interests: {', '.join(state['interests'])}

Ground your suggestions in this research:
{state['research']}
{revision_note}

Format as "Day 1:", "Day 2:", etc. Be specific and concise."""

    print(f"\n✍️  Drafting itinerary (attempt {state['revision_count'] + 1})...")
    response = llm.invoke(prompt)
    return {
        "itinerary": response.content,
        "revision_count": state["revision_count"] + 1,
    }


def critique_node(state: TripState) -> dict:
    """LLM node: acts as a reviewer and decides pass/fail."""
    prompt = f"""Review this travel itinerary critically:

{state['itinerary']}

Traveler interests: {', '.join(state['interests'])}
Required days: {state['days']}

Does it cover all {state['days']} days? Does it reflect the stated interests?
Respond in EXACTLY this format:
APPROVED: yes or no
FEEDBACK: <one or two sentences of specific feedback, or "None" if approved>"""

    print("\n🔎 Critiquing itinerary...")
    response = llm.invoke(prompt).content

    approved = "approved: yes" in response.lower()
    feedback_lines = [l for l in response.split("\n") if l.lower().startswith("feedback:")]
    feedback = feedback_lines[0].split(":", 1)[1].strip() if feedback_lines else ""

    return {"is_approved": approved, "feedback": feedback}


def budget_estimate_node(state: TripState) -> dict:
    """LLM node: only runs after the itinerary is approved.
    Third agent - estimates a rough daily cost breakdown."""
    prompt = f"""Given this approved {state['days']}-day itinerary for {state['destination']}:

{state['itinerary']}

Estimate a rough daily budget breakdown in local currency for a mid-range
traveler, covering: accommodation, food, activities/entry fees, and local
transport. Give a per-day estimate and a total for the trip. Be concise -
a short table or list is fine, this doesn't need to be precise, just a
reasonable ballpark."""

    print("\n💰 Estimating budget...")
    response = llm.invoke(prompt)
    return {"budget_estimate": response.content}