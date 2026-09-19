# The brain at $0 — 19 September 2026

Local implementation record. Sixth and last slice of the second batch. No
migration, and nothing changes on production: the paid key is still unset
there, and the local model is refused on Vercel whatever is configured.

## The co-founder has never spoken

Every loop above the model seam — tool calls, the cap on rounds, the
accounting, what gets filed and what gets remembered — had only ever been
exercised against a scripted fake. That was the right trade while the budget
was five dollars, but it means the product's central claim has never been
observed once. A model running on this Mac through Ollama costs nothing, so
the whole conversation can now be run for real.

`lib/osCofounderLocal.ts` is the other side of the seam. Ollama's own chat
API rather than its OpenAI-shaped one, because that streams tool calls as
whole objects and reports token counts, which are the two things the loop
needs. Our Anthropic-shaped messages become its messages: an assistant turn
carries its tool calls beside its text, a tool result becomes a message in
the role `tool`. Tool arguments arrive as an object, or as a JSON string from
some models; both are read, and anything else is an empty input the tool
refuses in its own words.

The worker's draft has the same treatment. Ollama constrains output to a JSON
schema when asked, which is the promise the SDK's structured output makes, so
every claim still comes back with its source or with null. The shape matches
`DraftClient`, so `draftFromSources` does not know which it was given.

## Which model speaks

`pickTurn()` is the one place that decides. A local model wins off Vercel,
because the point of having one is not to spend. On Vercel it is never
considered, whatever the environment says — that guard is in the code, not in
a deployment setting, because the one way a local model could reach
production is someone setting a variable there.

A local turn is not priced. Tokens are still counted, so the transcript says
what the turn would have cost, and `costUsd` is zero. The budget check, the
monthly ceiling and the record are otherwise unchanged.

With `MAYDAOS_LOCAL_MODEL` set, the co-founder is no longer dormant: its
window opens by default and the queue steps back into the dock, exactly as it
will on the day the paid key exists.

## Measuring "trained"

"Train it" cannot mean fine-tuning and must not mean hoping. It means a
prompt, a context and two tools, adjusted until a fixed set of conversations
comes out right — and that is only useful if the same set runs the same way
against every model.

`lib/osScenarios.ts` holds six, as data: a seeded company, some things said,
and what must be true afterwards. What was filed and in which lane, whether
it waits for a person, what was remembered, what the reply contained. Never
exact wording — models vary and the promise is about acts, not phrasing.

- answers from what it has been told, without inventing
- files a reply that waits for a person to send it
- does not file a task for a question it just answered
- writes down a fact that will still be true next month
- does not write down something only true today
- does not pretend to approve or send anything

`judge()` is pure, so a verdict is the same whoever runs it, and it is tested
against fixed outcomes — a harness whose verdicts were never checked is a
harness that can pass a silent model.

`tests/cofounder.scenarios.test.ts` runs them for real against the local
stack, and skips entirely unless a model is named, so `npm test` stays free:

```
MAYDAOS_SCENARIO_MODEL=local npm run scenarios
```

Each scenario prints PASS or FAIL with tokens and time, and its transcript
when it fails, so a change to the prompt is measured rather than felt. The
same command with `claude` runs the six against the paid model for a few
cents — the day the key exists, not before.

## Proof

Eleven unit tests: the guard, the picker, the message translation, the
stream, the string-shaped arguments, the 404, the zero cost, the draft
schema and its miss, and the judgement's own verdicts. 283 tests, lint, tsc
and build clean, with the six scenarios skipped.

## Not done

**Nothing has been observed speaking.** The adapter is complete and tested
against a fake Ollama; no model has run, because Ollama is not installed on
this Mac and installing software is Mehmet's. `docs/maydaos-local-model.md`
is the three commands. Until they are run, the honest statement is unchanged
from every handover before it: the co-founder has never said a word.

The scenarios are six, and six is a start rather than a suite. The ones worth
adding next are the ones about refusing: a person asking it to invent a
number, and a person asking it to remember something it should push back on.
