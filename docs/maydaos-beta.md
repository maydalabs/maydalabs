# MaydaOS beta

Shipped 4 Sep 2026 (`2c19ef9`), migration applied to production. Hidden until
the API key exists, so nothing is promised that cannot run.

## What it is

MaydaOS stopped being a demo desktop and became the client-facing face of the
system MaydaLabs sells. A signed-in person hands it links, the model produces
the piece with every claim attached to the source it came from, and nothing
leaves without their approval. The free beta is the bottom rung of the ladder:
software only, then software plus operations, then the full build.

## The decisions behind it

- **Ten credits, for life.** A weekly refill costs money forever and never asks
  anyone to decide anything. A wall is where the conversation starts.
- **One credit is one model call.** Honest and ungameable. Everything that does
  not call the model is free and unlimited: adding sources, seeing what will be
  sent, editing, approving, rejecting, re-reading the record.
- **One workflow, three shapes** (short note, LinkedIn post, summary of the
  sources). Letting it draft anything makes it a chatbot: unbounded in cost,
  undifferentiated in market, and it teaches nobody about the approval gate.
- **A failed run is never charged.** If the links cannot be read or the model
  returns nothing, the run is recorded and the credit is not spent.
- **Running out is not a paywall.** It opens their record: runs, approvals,
  sources cited. That page is a proposal filled in with their own work, and the
  call to action is a conversation, not a price.

## Cost control

| Lever | Setting |
| --- | --- |
| Model | `claude-opus-5` — draft quality is the entire demonstration |
| Effort | `low` — thinking bills as output, and this is not reasoning-heavy work |
| Per run | roughly $0.055 at 6k in / 1k out |
| Per person | ten credits, about $0.55 if they use every one |
| Daily ceiling | `MAYDAOS_DAILY_USD_CAP`, default $2, worst case is days not hours |
| Recorded | every run stores its tokens and dollar cost, so "what does a user cost" is a number |

Twenty dollars carries roughly 360 runs. Most people never use ten, so expect
sixty to eighty signups before the balance matters. If signups outrun it,
switching `OS_MODEL` to `claude-sonnet-5` in `lib/os.ts` halves the cost.

## Safety

- **Link fetching is guarded.** Hostnames are resolved and anything private,
  loopback, link-local, carrier-grade NAT or unique-local is refused; redirects
  are not followed; responses are capped at 512 KB and 6,000 characters. Verified
  in the live interface against `169.254.169.254`, the cloud metadata address.
- **A citation to a URL the model was not given is stripped.** A model naming a
  source it never read is not evidence.
- **Payment of attention, not of trust.** A person may record their own decision
  and nothing else. Column grants enforce it, because row-level security cannot
  restrict columns. The suite proves they cannot rewrite a draft, zero a cost, or
  grant themselves credits.

## Invite-only while the balance is small

The beta spends a MaydaLabs API balance, so being signed in is not the same as
being allowed to spend it. Set `MAYDAOS_ALLOWLIST` to a comma-separated list of
emails and only those people can run anything; everyone else sees an
invite-only note. Leave it unset and the beta is open to anyone signed in.

Keep it set while the balance is shared with Abidin. One stranger who signs in
and uses ten credits costs about $0.55, so a $4 balance is seven strangers away
from stopping Abidin's drafting.

## To switch it on

1. Console, new workspace (keep it away from Abidin's), create a key named
   something like `maydaos-beta`. Set a spend limit on the workspace.
2. Top up to $20 and leave auto-reload off.
3. Vercel, project `maydalabs`, environment variables, all environments:
   - `MAYDAOS_ANTHROPIC_API_KEY` = the new key
   - `MAYDAOS_DAILY_USD_CAP` = `2` (optional; this is the default — set it to
     `1` while the balance is small)
   - `MAYDAOS_ALLOWLIST` = your email, while the beta should stay closed
4. Redeploy. The beta door appears on `/os` and the desk starts working.
5. Diary the key's expiry. Abidin's died silently on a Thursday.

## Not built yet, deliberately

Operator view of beta users and their credit burn (the best lead signal there
is), one-click top-ups, and the revision-of-a-draft flow. All cheap, none
needed to learn whether anyone completes a first run.
