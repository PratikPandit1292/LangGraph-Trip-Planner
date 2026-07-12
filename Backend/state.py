"""
STATE = the shared notebook that flows through every node in the graph.
Every node receives the current state, and returns a dict of the fields
it wants to update. LangGraph merges that dict back into the state.

Think of it like a form that gets passed from desk to desk in an office -
each desk (node) fills in a few more fields before passing it on.
"""

from typing import TypedDict, List


class TripState(TypedDict):
    # ---- inputs (set once, at the start) ----
    destination: str
    days: int
    interests: List[str]

    # ---- filled in as the graph runs ----
    resolved_location: str  # unambiguous location name from geocoding lookup
    research: str          # raw notes from the search tool
    itinerary: str          # the current draft
    feedback: str           # critique from the last review
    is_approved: bool       # did the critique pass it?
    revision_count: int     # how many drafts we've written so far
    budget_estimate: str    # rough cost breakdown, filled in after approval