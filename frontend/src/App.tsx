import { useState, useRef, useEffect } from "react";

const API_URL = "http://localhost:8000/api/plan";

interface TripResult {
  destination: string;
  resolved_location: string;
  itinerary: string;
  budget_estimate: string;
  is_approved: boolean;
  revision_count: number;
}

// Splits the itinerary text into "Day 1: ..." chunks so we can render
// each day as its own stop along the route line.
function splitIntoDays(itinerary: string): { label: string; text: string }[] {
  const parts = itinerary.split(/\n(?=Day\s*\d+)/i).filter(Boolean);
  return parts.map((part) => {
    const match = part.match(/^(Day\s*\d+)[:\s]*/i);
    const label = match ? match[1] : "Day";
    const text = match ? part.slice(match[0].length).trim() : part.trim();
    return { label, text };
  });
}

const LOADING_STEPS = [
  "Resolving your destination…",
  "Researching local attractions…",
  "Drafting the itinerary…",
  "Reviewing the draft…",
  "Estimating your budget…",
];

const INTEREST_OPTIONS = [
  "Food",
  "History",
  "Hiking",
  "Culture",
  "Nature",
  "Shopping",
  "Nightlife",
  "Art & Museums",
  "Photography",
  "Relaxation",
];

function App() {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TripResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Once results (or the loading indicator) appear, scroll the page down
  // to reveal them. The fixed background photo doesn't move - only the
  // page content scrolls over it.
  useEffect(() => {
    if (loading || result) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, result]);

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedInterests.length === 0) {
      setError("Pick at least one interest.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setLoadingStep(0);

    const stepTimer = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 2200);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          days,
          interests: selectedInterests,
        }),
      });

      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data: TripResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(
        "Couldn't reach the planner. Make sure the backend is running on localhost:8000."
      );
    } finally {
      clearInterval(stepTimer);
      setLoading(false);
    }
  }

  const days_list = result ? splitIntoDays(result.itinerary) : [];

  return (
    <div className="relative min-h-screen text-parchment overflow-hidden">
      {/* ---- animated background layers ---- */}
      <div className="fixed inset-0 -z-10 bg-photo" />
      <div
        className="fixed -z-10 w-[36rem] h-[36rem] rounded-full bg-gold/10 blur-[120px] bg-orb-gold"
        style={{ top: "-8rem", left: "-6rem" }}
      />
      <div
        className="fixed -z-10 w-[30rem] h-[30rem] rounded-full bg-teal/10 blur-[120px] bg-orb-teal"
        style={{ bottom: "-6rem", right: "-4rem" }}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-ink/60 via-ink/80 to-ink" />

      <div className="relative px-6 py-14 md:py-20">
      <div className="max-w-2xl mx-auto">
        {/* ---- Header ---- */}
        <header className="mb-12 animate-fade-in-up">
          <p className="font-mono text-xs tracking-[0.25em] text-gold-soft uppercase mb-3">
            Boarding pass · Agent-planned journey
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-medium leading-tight">
            Where are we
            <br />
            headed?
          </h1>
          <p className="text-muted mt-4 text-sm md:text-base max-w-md">
            A small LangGraph agent researches a destination, drafts an
            itinerary, checks its own work, and prices it out — end to end.
          </p>
        </header>

        {/* ---- Form ---- */}
        <form
          onSubmit={handleSubmit}
          className="bg-ink-light/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 mb-10 animate-fade-in-up-delayed"
          style={{ animationDelay: "0.12s" }}
        >
          <div className="grid gap-5">
            <label className="block">
              <span className="text-xs font-mono uppercase tracking-wider text-muted">
                Destination
              </span>
              <input
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Manali, Paris, Tokyo…"
                className="mt-1.5 w-full bg-transparent border-b border-white/20 focus:border-gold outline-none py-2 text-lg font-display placeholder:text-muted/50 transition-colors"
              />
            </label>

            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-muted">
                Interests
              </span>
              <div className="flex flex-wrap gap-2 mt-2.5">
                {INTEREST_OPTIONS.map((interest) => {
                  const active = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      aria-pressed={active}
                      className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
                        active
                          ? "bg-gold border-gold text-ink font-medium"
                          : "bg-transparent border-white/20 text-parchment/80 hover:border-white/40"
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-muted">
                Days
              </span>
              <div className="mt-2 inline-flex items-center gap-4 bg-ink/40 border border-white/15 rounded-full pl-1.5 pr-1.5 py-1.5">
                <button
                  type="button"
                  onClick={() => setDays((d) => Math.max(1, d - 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gold-soft hover:bg-white/10 transition-colors text-lg leading-none"
                  aria-label="Decrease days"
                >
                  −
                </button>
                <span className="font-mono text-xl w-14 text-center tabular-nums">
                  {days}
                  <span className="text-muted text-xs ml-1">
                    {days === 1 ? "day" : "days"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setDays((d) => Math.min(30, d + 1))}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gold-soft hover:bg-white/10 transition-colors text-lg leading-none"
                  aria-label="Increase days"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full md:w-auto px-8 py-3 bg-gold hover:bg-gold-soft disabled:opacity-50 disabled:cursor-not-allowed text-ink font-medium rounded-full transition-colors"
          >
            {loading ? "Planning…" : "Plan the trip"}
          </button>
        </form>

        <div ref={resultsRef}>
          {/* ---- Loading state ---- */}
          {loading && (
            <div className="text-center py-10">
              <div className="inline-flex items-center gap-3 text-gold-soft font-mono text-sm">
                <span className="w-2 h-2 rounded-full bg-gold-soft animate-pulse" />
                {LOADING_STEPS[loadingStep]}
              </div>
            </div>
          )}

          {/* ---- Error state ---- */}
          {error && (
            <div className="border border-red-400/30 bg-red-400/10 text-red-200 rounded-xl p-4 text-sm mb-8">
              {error}
            </div>
          )}

          {/* ---- Results ---- */}
        {result && !loading && (
          <div className="space-y-10 animate-fade-in-up">
            {/* Resolved location stamp */}
            <div className="flex items-center gap-3">
              <div className="font-mono text-xs uppercase tracking-widest border border-teal-soft/50 text-teal-soft rounded-full px-3 py-1">
                Resolved
              </div>
              <p className="text-sm text-muted">{result.resolved_location}</p>
            </div>

            {/* Journey / route line of days */}
            <div className="relative pl-8">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-gold via-white/15 to-transparent" />
              {days_list.map((day, i) => (
                <div
                  key={i}
                  className="relative pb-8 last:pb-0 animate-fade-in-up-delayed"
                  style={{ animationDelay: `${0.15 + i * 0.12}s` }}
                >
                  <div className="absolute -left-8 top-1 w-3.5 h-3.5 rounded-full bg-gold border-4 border-ink" />
                  <p className="font-mono text-xs uppercase tracking-widest text-gold-soft mb-1">
                    {day.label}
                  </p>
                  <p className="text-parchment/90 leading-relaxed text-[15px]">
                    {day.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Approval status */}
            <p className="text-xs font-mono text-muted">
              {result.is_approved ? "✓ approved" : "○ not yet approved"} ·{" "}
              {result.revision_count} draft
              {result.revision_count === 1 ? "" : "s"} written
            </p>

            {/* Budget - receipt style */}
            <div className="bg-ink-light/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8">
              <p className="font-mono text-xs uppercase tracking-widest text-teal-soft mb-4">
                Estimated budget
              </p>
              <pre className="whitespace-pre-wrap font-mono text-sm text-parchment/90 leading-relaxed">
                {result.budget_estimate}
              </pre>
            </div>
          </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export default App;