# MaydaLabs review and next build direction

Reviewed September 5 on the Mac, starting from `1252415`. Read the Claude
handoff and canonical commercial state first; inspected the live homepage,
offers and MaydaOS, the implementation and the local working beta. This is a
prioritized review, not a claim that the whole redesign is complete.

## Diagnosis

The work is substantial, but the experience mixes three different jobs:
selling MaydaLabs' work, servicing existing clients, and demonstrating unfinished
software. Five apps in an OS-looking shell do not yet provide the operator a
useful answer to "What needs me now?" Public visitors should not be testers.

The public message is also more technical than the buying decision. "Evidence-
gated operations" describes the mechanism, but the buyer first needs the
specific repeated job, the change they will receive, and inspectable proof.
The all-industry audience and current founder tagline remain approved facts;
this review does not silently narrow them or undo the Claude work.

## Implemented first pass

1. Private beta enforced in pages, actions and the database; no public tour or
   default auth-to-OS funnel. Customer portal restored independently.
2. Shorter homepage hero and legible separation from its decorative diagram.
   At 1280×720 the buttons are visible; at 390×844 both buttons finish around
   y=676 and document width equals viewport width.
3. Offers now precede the Bitcoin dashboard. The dashboard is retained below
   the buyer narrative and case work; Bitcoin remains proof/capability, not the
   universal buyer identity.
4. Removed client state/observers from the reveal wrapper. Content paints
   without waiting for hydration or an intersection threshold.
5. Corrected the footer's server/client boundary. Browser verification caught
   `BitcoinClock is an async Client Component`; the server-rendered footer now
   passes through a client visibility slot, with a server-only import guard.
6. Isolated supplementary network widgets with Suspense, bounded the footer
   fetch, and bucketed the historical-price timestamp to the existing 15-minute
   cache period instead of generating a new cache key each second.

These are concrete reliability and rendering improvements. No controlled
before/after production Web Vitals measurement was performed, so there is no
"10× faster" claim. The logo, colors, approved tagline, ownership labels and
delivered client work were preserved.

## Next product pass: make the work the interface

Recommended private workspace hierarchy:

- **Today:** decisions waiting, failed runs needing attention, recently completed
  work. Every count and card comes from actual records; no demo KPI totals.
- **Workflows:** the named recurring job, its owner, inputs, output destination,
  last run, next human action and cost. Clear empty and not-configured states.
- **Review:** one strong review experience with draft, source-by-source evidence,
  edits, approval/rejection and an explicit manual outcome record.
- **History:** inspectable runs, costs and decisions. Never equate an approved
  draft with something published, delivered or paid.
- Account and client engagement stay secondary. Terminal navigation is optional,
  not the main product or a prerequisite to getting work done.

Build one real recurring workflow through this complete path before adding a
generic builder, more navigation apps, teams, or new integrations. Before more
testers, reserve budget atomically and make run creation idempotent. Keep
Abidin canonical and any transfer manual; no publishing/sending/spending powers
are gained through this interface work.

## Next public pass: plain buying decisions and better evidence

1. Explain one recognizable use case per offer, with inputs → actual deliverable
   → ownership → what the buyer does next. Keep broader full-stack capability
   visible without making an unsupported promise to do everything equally well.
2. Make case evidence do more work: show the real interface and the delivered
   feature beside each claim. SG is owned independent publication evidence;
   HodlStay is client work; Sofra is private Phase 1; Mortal Vault is private,
   unaudited alpha. Do not turn project counts into results or endorsements.
3. Replace repetitive mechanism copy and large tool lists with the questions
   buyers ask about scope, review, ownership, maintenance and ongoing cost.
4. Reconcile the visible pilot price/duration claims with the still-open
   canonical pricing decision before a commercial relaunch. Likewise, the
   homepage's static SG publication count needs a dated, consistent source;
   a count is not a proven efficiency or revenue outcome.
5. Measure production LCP/INP/CLS and conversion events before choosing the
   next speed work. Keep live data supplementary; cached failure states must
   not turn the sales page into a blank screen.

No new prices, guaranteed review times, quantified improvements, testimonials,
Web3 wallet/token features, or new public product launch were approved here.
