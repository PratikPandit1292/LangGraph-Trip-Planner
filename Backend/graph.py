"""
GRAPH = wires the nodes together into a flowchart.

Flow:

    resolve --> research --> draft --> critique --+
                                ^                  |
                                |    (if not approved and under revision limit)
                                +----- revise ------+
                                                    |
                                                    | (if approved OR out of revisions)
                                                    v
                                                 budget --> END

The interesting part is add_conditional_edges: after "critique" runs,
LangGraph calls should_revise(state) to decide which path to take NEXT.
That's what makes this an agent instead of a fixed script - the path
through the graph depends on what the LLM decided at runtime.
"""

from langgraph.graph import StateGraph, END
from state import TripState
from nodes import (
    resolve_location_node,
    research_node,
    draft_itinerary_node,
    critique_node,
    budget_estimate_node,
    MAX_REVISIONS,
)


def should_revise(state: TripState) -> str:
    """A conditional edge is just a function that returns the NAME of
    the next path. LangGraph looks up that name in the mapping below."""
    if state["is_approved"] or state["revision_count"] >= MAX_REVISIONS:
        return "finish"
    return "revise"


def build_graph():
    graph = StateGraph(TripState)

    # 1. Register each node under a name
    graph.add_node("resolve", resolve_location_node)
    graph.add_node("research", research_node)
    graph.add_node("draft", draft_itinerary_node)
    graph.add_node("critique", critique_node)
    graph.add_node("budget", budget_estimate_node)

    # 2. Where does the graph start?
    graph.set_entry_point("resolve")

    # 3. Plain edges: always go from A to B
    graph.add_edge("resolve", "research")
    graph.add_edge("research", "draft")
    graph.add_edge("draft", "critique")

    # 4. Conditional edge: after "critique", branch based on should_revise()
    graph.add_conditional_edges(
        "critique",
        should_revise,
        {
            "revise": "draft",   # <-- this is the loop: back to draft
            "finish": "budget",  # <-- approved drafts move on to budgeting
        },
    )

    # 5. budget always runs last, then the graph ends
    graph.add_edge("budget", END)

    return graph.compile()