# Running the co-founder on your own Mac

The co-founder and the worker speak through one seam. On production that
seam is the paid model, and its key is deliberately unset, so nothing bills.
On your Mac the same seam can be a model running locally through Ollama,
which costs nothing. Everything above the seam — the conversation, the
tools, what gets filed and remembered, the worker's drafts with their
sources — runs for real. What a local model cannot do is be Claude: use it
for the plumbing and the harness, not to judge the product's voice.

It is never used on Vercel. The code ignores the variables there whatever
they are set to.

## Once

```bash
brew install ollama
```

```bash
brew services start ollama
```

```bash
ollama pull qwen3:14b
```

`qwen3:14b` is about 9 GB and runs comfortably on an M4 with 32 GB; it
supports tool calls and structured output, which the co-founder and the
worker need. `gpt-oss:20b` (about 13 GB) is stronger at tool use if you want
a second opinion.

Then in `.env.local`:

```
MAYDAOS_LOCAL_MODEL=qwen3:14b
```

(`MAYDAOS_LOCAL_MODEL_URL` defaults to `http://127.0.0.1:11434`.)

## Talk to it

Start the dev server and open the desk. The co-founder window is no longer
dormant: it opens by default, and the queue steps back into the dock. Ask it
what is open. Tell it something about the company and watch *Noted* appear.
Ask it to draft a reply and put it in your queue, then open the queue and
find it waiting for you to approve — which it cannot do itself, and the
database would refuse if it tried.

The transcript records tokens for every turn and a cost of zero.

## Measure it

```bash
MAYDAOS_SCENARIO_MODEL=local npm run scenarios
```

Six scenarios in `lib/osScenarios.ts`, each a seeded company, a few things
said, the person's composer selection for each message (`request`: ask,
draft with a format, knowledge with the typed assertion), and what must be
true afterwards — what was filed, what was remembered, whether it pretended
to approve. Never exact wording. Since 1 October the runner drives the
desk's own loop (`runReviewedTurn` with `reviewedSystemFor`): proposals are
staged through the route's chain over an in-memory company, and every card
is then saved unchanged by the harness, exactly as a person's Save would
write it — no person decided, and the report says so. Ask-mode scenarios
hold their file/remember checks by construction (the report lists them per
case under `guaranteedByConstruction`); the reviewed checks report an
attempted tool, a refusal, a receipt that disagrees with the cards, a reply
with no prose, or a claim that something was saved. The legacy
`file_work` loop is measured only from history (`e35370b` and before). Each
case prints its status with tokens and time; `MAYDAOS_SCENARIO_VERBOSE=1`
prints every transcript.

The same command with `MAYDAOS_SCENARIO_MODEL=claude` runs the six against
the paid model and costs money — a few cents for the set. That is the day
the key exists, not before.
