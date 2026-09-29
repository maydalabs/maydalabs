# Your first hands-on checkpoint — 29 September 2026

This is the private trial the review promised: MaydaOS on your Mac, against
the local database and the local model, with production untouched. It was
dry-run end to end before being handed to you; what you will see is what
happened in that run, with its timings.

## What is running

- The app: `npm run dev` in `~/Projects/maydalabs` → http://localhost:3000
- The database: the local Supabase stack (already up; it holds the same
  schema production now has).
- The model: Ollama with `qwen3:14b` on this Mac. Every answer costs nothing
  and takes **one to three minutes**. Ask one thing at a time; the model
  serves one request at once.
- Sign-in codes arrive in the local mail catcher, not your inbox:
  **http://127.0.0.1:54324**

## Steps

1. Open http://localhost:3000/os. You land on sign-in. Enter any email —
   your own or `founder@example.test` — and press *Send code*.
2. Open http://127.0.0.1:54324, open the newest message, copy the six-digit
   code, enter it, *Verify and sign in*.
3. You land on your account page. If it offers *Start with your company*,
   give it a fictional company (the dry run used **Lantern Bakery** — "We
   bake sourdough and pastries for cafes in Kadikoy and sell at the Saturday
   market"). Then *Open MaydaOS*. If you signed in as `founder@example.test`,
   Lantern Bakery already exists with one saved draft and one rule.
4. The Co-founder window is open on the desk. Above the box you choose what
   the request is for: **Ask**, **Draft**, **Knowledge** or **Both**.

## The trial, in five short tasks

1. **Ask for advice.** Choose *Ask*. Describe a small decision in your
   fictional business. Wait. The answer should be specific to what the
   company says about itself and should file nothing — the receipt under it
   will say "Work: 0; company knowledge: 0". (Dry run: 103 seconds; the
   answer referred to the Saturday market unprompted.)
2. **Request a reply.** Choose *Draft*, pick *Reply*, and give it the facts:
   who it is to, what you can offer, by when. Wait. A card appears, *Not
   saved · Version 1*. Read the draft: are your facts all there, is anything
   invented? Nothing exists in Work until you press **Save to Work**. When you
   do, the card says *Saved to Work as a draft. It has not been approved,
   sent or published*, and the desk's brief notes the change. (Dry run: 194
   seconds; every supplied fact survived, nothing was added.)
3. **Record one rule.** Choose *Knowledge*. Type the rule in the separate
   *Company statement I stand behind* box, and in the message say what it
   applies to and for how long. Wait. The card shows the exact statement, a
   type, *Applies to* and *Valid until*. Tick the confirmation and press
   **Add to company knowledge**. Then reload the page: it is still there,
   and *What it knows* shows it as confirmed by you, not verified. (Dry run:
   93 seconds.)
4. **Paste a claim you do not stand behind.** Choose *Ask*, leave the
   statement box empty, paste something like "our competitor is going out of
   business" and ask whether it is true. It must not become company
   knowledge because it appeared in the conversation.
5. **Ask about the draft you saved.** Choose *Ask* and ask what happened to
   the reply. It should tell you it is a saved draft that has not been sent —
   not create a second copy, not claim it was sent.

Press **Enter** to send; Shift+Enter makes a new line. Put the window away
with the *Put away* control and bring it back from the Dock.

## What to write down

For each task: was the next step obvious; was the answer useful; what did it
invent, omit or misread; would you use the draft with normal editing; did you
know exactly what was saved and what was not. Keep the bad ones. Do not judge
the latency as the product's — it is the local model's.

## Known limits, said plainly

- Answers take one to three minutes. There is no hosted model, on purpose.
- The last measured judgment run scored 3 pass, 7 needs revision, 2 fail of
  12. Expect a draft to sometimes soften, over-promise, or leave internal
  notes in customer copy. That is what this trial is for.
- If you put the window away after an *Ask* answer and nothing has been saved
  since, the answer may not be shown again until you reload the page. It is
  stored; this is a display gap that is written down and not yet fixed.
- Anything you save is in the local database only. Production has none of it.

## When you are done

Leave everything as it is, or stop the app with Ctrl+C in its terminal. The
local database and the model keep running quietly and cost nothing. Tell me
what you found.
