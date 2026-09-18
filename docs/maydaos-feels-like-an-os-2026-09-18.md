# Feels like an OS — 18 September 2026

Local implementation record. Third slice of the second batch. No migration.

## Chords

⌃⌥← and ⌃⌥→ send the front window to a half of the desk; ⌃⌥↑ or ⌃⌥↩
fills it; ⌃⌥↓ puts it away; ⌃⌥⌫ closes it; ⌃⌥⇥ brings the window under
the front one forward; ⌃⌥1 to ⌃⌥7 toggle the dock by position. They are
Rectangle's chords, because that is the convention on the Mac this
imitates — and because plain ⌥ combinations are how a Turkish keyboard
types @ and {, so a chord built on ⌥ alone would collide with typing.

The digit chord accepts the physical key or the key itself: on some layouts
⌥ turns the digit row into symbols, and the browser's synthetic events
during testing reported no physical key at all — which is how the second
path was found.

## The bar lists what it can do

⌘K with nothing typed now shows the apps and the window commands, each with
its chord as the hint, so the chords can be learnt from the place a person
already goes. Before this an empty bar listed eight arbitrary work items and
the window commands were cut off the end. Typing still finds everything.

## Windows leave

A window put away sinks toward the dock; a closed one shrinks toward its
own centre; both fade, in 200ms. The state changes when the moment is over,
on a timer rather than on animationend, because animationend never fires for
a person who has asked for reduced motion — and for them the window simply
goes. The blur under a pane is off while anything is being dragged: under a
92% opaque pane it was invisible and was recomputed on every frame.

## Forms say what they did

Every action on the desk used to end in silence. Approve, send back, mark
done, dismiss, add, tell it, retire, mark seen: each now dims its buttons
while it works — so a second press cannot approve something twice — and
raises a notice when it is done. *Approved.* *Saved.* *Added to work.* One
quiet line above the dock for three seconds, which confirms and asks for
nothing. The server actions are unchanged; the database still says yes or no.

## Workflows, on the desk

The Running window used to send a person out to a portal page with the
site's header on it to set anything up — the moment an operating system
turns back into a website. A workflow is now added and changed inside the
window. The person's own workflows carry their form; everyone else's stay
as activity. Saving refreshes the desk, and the brief says when it will run.

## Proof

264 tests, lint, tsc and build clean. In the browser: ⌃⌥← measured the
window at half the surface, ⌃⌥→ at the other half, ⌃⌥↓ put it away; ⌘K
listed the five window commands with their chords; Approve raised
*Approved.* and the brief recorded the approval; a workflow created from the
Running window appeared there as due and in the brief as running within the
hour.

## Not done

- Chords are not on the phone, where there is nothing to arrange.
- A notice cannot be pressed to undo. Nothing on the desk can be undone yet;
  the record is append-only by design, and undo would be a further act, not
  an erasure.
- The four remaining visual-plan items (queue rows, memory rows) are still
  open; two of them, dragging and submit feedback, closed here.
