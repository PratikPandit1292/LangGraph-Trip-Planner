from dotenv import load_dotenv

load_dotenv()  # reads ANTHROPIC_API_KEY from your .env file

from graph import build_graph


def main():
    print("=== LangGraph Trip Planner ===\n")
    destination = input("Destination: ").strip()
    days = int(input("Number of days: ").strip())
    interests = input("Interests (comma-separated, e.g. food, hiking, history): ").strip()

    app = build_graph()

    initial_state = {
        "destination": destination,
        "days": days,
        "interests": [i.strip() for i in interests.split(",")],
        "resolved_location": "",
        "research": "",
        "itinerary": "",
        "feedback": "",
        "is_approved": False,
        "revision_count": 0,
        "budget_estimate": "",
    }

    # invoke() runs the whole graph, following edges (and loops)
    # until it reaches END, then returns the final state.
    final_state = app.invoke(initial_state)

    print("\n" + "=" * 50)
    print("FINAL ITINERARY")
    print("=" * 50)
    print(final_state["itinerary"])
    print(
        f"\n(Approved: {final_state['is_approved']}, "
        f"revisions used: {final_state['revision_count']})"
    )

    print("\n" + "=" * 50)
    print("BUDGET ESTIMATE")
    print("=" * 50)
    print(final_state["budget_estimate"])


if __name__ == "__main__":
    main()