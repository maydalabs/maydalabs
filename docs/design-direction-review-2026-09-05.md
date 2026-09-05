# MaydaLabs design direction review — 2026-09-05

Status: Mehmet selected **A — Connected flow** with "go with A" on September 5.
The next isolated art/motion prototype is prepared for review; B is retained
below as the historical alternative. Selection is not final copy/art approval,
production implementation approval or deployment approval. See
docs/connected-flow-prototype-2026-09-05.md for the refinement and checks.

## 1. What changed in the brief

Mehmet rejected local 7513f3e after rejecting the standalone diagram in live
93011e1. He clarified that the animation is inspired by Abidin and how he and
the assistant work: preparation, human judgment, approved action. Keep the
left side subtle; progressively increase visibility toward a full-strength
human-approval focal point. He also rejected the homepage's five-row service
catalogue as visually weak. He approved continuing the assessment/planning,
including comparison before another production-facing implementation.

The previous technical checks remain valid for the old layout, but are not
design acceptance. 7513f3e is not release-ready on aesthetic grounds. The
commercial family is not being silently renamed or replaced by new packages.

## 2. Recovered references and evidence limits

Read-only Git recovery identified:

- 1f522d3, September 3 identity pass: SignalField is described as sparse
  signals converging at 62% width, faint behind the headline. Its own mask
  increases toward the gate; its outgoing line fades toward the outer edge.
- 752ccd5: later GateFigure/source styling, including a Bitcoin strand.
- bd8a318: last inspected pre-Codex-rework hero composition, SignalField
  behind a spaced copy stack and a separate GateFigure on desktop. Original
  AI-only copy and pilot CTA are historical, not material to restore.
- 9b8dd92: added the sub-960px hiding rule to address overflow. It is not an
  acceptable future mobile solution, despite belonging to the older version.
- 7513f3e: the entire figure is capped at opacity .3 (.18 on narrow screens)
  and attenuated by another overlay; this prevents approval from becoming
  the strong visual endpoint Mehmet now specifies.

These source references establish mechanics, not a verified screenshot of
the exact historical version Mehmet remembers. Do not claim exact visual
restoration. Preserve the reference's line language and spatial emphasis;
do not revive old offers, Bitcoin-first positioning, pilot prices or public OS.

## 3. Fixed boundaries

- All-industry MaydaLabs, selling concrete website/software/automation work.
- Five detailed services remain: websites/stores, custom software, AI and
  automation, email/customer journeys, fixes and support.
- Homepage goal-based stories are navigation into these services, not three
  mandatory packages, renamed contracts, or a compulsory diagnostic.
- Direct contact remains available immediately. No signup before value.
- MaydaOS stays private; Abidin stays private infrastructure. The public
  sequence is explicitly illustrative, not a usable control plane or live feed.
- Bitcoin dashboard remains near the bottom. No Bitcoin payments offer.
- Existing proof labels, metadata/social artwork, client billing and all
  auth/database boundaries stay out of this visual scope.

## 4. Two composition studies

### A — Connected flow (selected by Mehmet)

Dark continuous hero with quiet input lines extending behind the left copy.
Preparation becomes legible beside the copy, followed by one strong human
approval point and three small outcome labels: Product, Workflow, Customer
journey. Give the approval node its own undimmed layer. Contrast should rise
left-to-right; only peripheral artwork fades. Avoid doubled gates from two
independent overlapping SVG coordinate systems.

The next section pairs one generous visual example with three selectable
buyer situations. The selected example and concrete explanation change
together; the first is meaningful without interaction. Real work follows it.

Why consider it: strongest connection between the Abidin-inspired motif,
MaydaLabs' breadth and the user's request. Main risk: allowing schematic art
to overpower what MaydaLabs actually sells, or ending with another generic
workflow illustration. Final art needs custom detail and deliberate motion.

### B — Project chapters (editorial alternative)

Larger editorial headline, supporting copy/CTA alongside it, and a clearly
contained horizontal preparation/approval/outcome band. The services become
three bold chapters on a contrasting warm-light surface, then real project
evidence. This is deliberately different hierarchy, pacing and section
contrast—not A with a different accent colour.

Why consider it: makes business breadth and scanning prominent. Main risks:
the light service block is a brand change requiring explicit preference, and
the workflow band has less immersive continuity than A. Poster panels still
need project detail; changing catalogue rows into boxes alone is insufficient.

Use identical provisional headline/intro/CTA in both studies so visual
judgment is not confounded by copy preference. Prototype line: “Build what’s
next. Run it better.” This is draft copy, not a selected new tagline.

## 5. Services: buyer situation → concrete example → proof

| Homepage situation | Candidate example | Detailed services | Evidence boundary |
| --- | --- | --- | --- |
| Build something new | Website, app or customer portal | Websites/stores; custom software | HodlStay can support client full-stack delivery. A generic portal illustration is not a HodlStay screenshot. |
| Connect the moving parts | Enquiry organised, tools connected, response prepared for review | AI/automation; email/customer journeys | SG supports owned workflow capability. The generic enquiry/CRM example remains illustrative. No invented lifecycle revenue metrics. |
| Improve what you have | A clearer booking journey, a repaired integration, tested improvements | Fixes/support; software; website/customer-journey improvements | Use specific supported rebuild facts. Do not invent before/after conversion or speed figures. |

The mini interface in the comparison is schematic and explicitly labelled
illustrative. Replace it with a carefully designed scenario or permissioned
case detail after selection. Avoid fabricated customer records, synthetic
testimonials, income numbers and fake “live” badges.

HodlStay: Client build · Live. Satoshi Gazette: owned, editorially independent;
not a client. Sofra/private alpha work must not look like live customer proof.
Do not expose Abidin records or private operational screenshots.

## 6. Motion storyboard for the next prototype, not yet implemented

Aim for a complete 4.8-second sequence with a useful static composition from
the first frame. The story can play once, then remain still; replay is optional.

| Time | Motion | Meaning |
| --- | --- | --- |
| 0–1.0s | Two quiet signals travel toward preparation | An idea, request or existing information enters the work. |
| 1.0–2.0s | Paths align; preparation detail resolves | Work is organised and prepared, not magically completed. |
| 2.0–3.2s | Motion holds before approval | Human review is a real decision point. |
| 3.2–3.8s | One restrained approval accent | Depict a human-approved example, never automatic real authorization. |
| 3.8–4.8s | Outgoing paths trace toward useful outputs and settle | A product, workflow or customer journey can move forward. |

Use an “Illustrative workflow” label. No real approvals or actions occur.
For reduced motion show the final static diagram. A readable page must never
wait for the animation. Do not animate the headline, layout dimensions or
scroll position. Avoid adding a new animation framework for this motif.

On phones the concept uses a compact re-composed band, not a scaled desktop
canvas or giant diagram. The precise production mobile arrangement remains
an explicit visual review item; the current comparison is not final mobile UX.

## 7. Review gates and implementation sequence

1. **Composition choice:** Mehmet selects A, B, or a specific combination.
   Judge hero and services together at laptop size, then a narrow view. Ask:
   is human approval the clear focal point; is the company understandable;
   does the next section demonstrate relevant work; does it feel distinctive?
2. **Art and motion prototype:** refine one selected direction only in an
   isolated local review surface. Create the storyboard's keyframes and
   deliberate pause. Show a motion clip plus static laptop/mobile frames.
3. **Content and proof pass:** review exact short copy and permissioned
   project examples. Complete EN/TR/FR; preserve honest boundaries.
4. **Production implementation:** after direction/art approval, apply the
   selected composition with scoped CSS/components, keyboard/touch semantics,
   non-hover access, static content and explicit empty/error behavior if needed.
5. **Verification and review:** check static visual quality, no-JS/reduced
   motion, text zoom, CTA gaps, clear labels, keyboard operation, complete
   phone service access and existing route/private-beta contracts. Run lint,
   build, relevant tests and local smoke. Do not use passing tests as aesthetic
   approval. Ask for exact release approval before a push/deployment.

This pass changes no app code. Two in-conversation composition studies and
this brief are preparation. There is no market-demand research, new service
approval, production performance claim, conversion lift claim or release.
