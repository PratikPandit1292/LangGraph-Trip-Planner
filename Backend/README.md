# LangGraph Trip Planner (learning project)

A tiny agent that researches a destination, drafts a day-by-day itinerary,
critiques its own draft, and revises itself if needed — built to show off
the four core LangGraph ideas: **state, nodes, edges, and conditional edges
(loops)**.

## How it works

```
research --> draft --> critique --+
                ^                 |
                |   (not approved, revisions left)
                +------ revise ---+
                                  |
                                  | (approved, or out of revisions)
                                  v
                                 END
```

Read the files in this order to understand the concepts, top to bottom:
1. `state.py` — what data flows through the graph
2. `nodes.py` — the 3 functions that do the actual work
3. `graph.py` — how they're wired together (this is "the LangGraph part")
4. `main.py` — how you actually run it

## Setup (step by step)

**1. Open a terminal in this folder.**

**2. Create a virtual environment and activate it:**
```bash
python -m venv venv
source venv/bin/activate      # on Windows: venv\Scripts\activate
```
✅ Checkpoint: your terminal prompt should now show `(venv)`.

**3. Install dependencies:**
```bash
pip install -r requirements.txt
```
✅ Checkpoint: no red errors. Takes ~30-60 seconds.

**4. Add your API key:**
```bash
cp .env.example .env
```
Open `.env` and replace `your_key_here` with your real xAI (Grok) API key
(get one from console.x.ai / x.ai/api → API Keys → Create Key).
✅ Checkpoint: `.env` contains a key on the `XAI_API_KEY=` line.

**5. Run it:**
```bash
python main.py
```
You'll be prompted for a destination, number of days, and interests.
✅ Checkpoint: you should see console output in this order:
`🔍 Researching...` → `✍️ Drafting...` → `🔎 Critiquing...`
and possibly a second `✍️ Drafting...` if the critique asked for a revision,
before the final itinerary prints.

## Things to try once it works

- Set `MAX_REVISIONS = 0` in `nodes.py` and rerun — you'll see it skip the
  loop entirely, since there's no revision budget.
- Add a `print(state)` at the top of any node to watch the state grow
  as it moves through the graph.
- Add a 4th node, e.g. `budget_check_node`, and wire it in as another
  conditional branch — this is the natural next step toward something
  like your AutoHire pipeline.
