# MaydaLabs

**AI-run operations, you stay in control.**

MaydaLabs installs AI operating systems that run real business workflows, with
a human approval gate on every action that leaves the system. Built and
operated by [Mehmet E. Mayda](https://maydalabs.com/profile) from Istanbul.

Two offers, both already running in production:

| Offer | What it is | Proof |
| --- | --- | --- |
| **Evidence-gated AI operations** | Pick the workflow. We install the system. Pilot from $2,500, three to four weeks, then from $1,000 a month. | [Satoshi Gazette](https://satoshigazette.org) runs on it, publicly. |
| **Bitcoin payments engineering** | Scoped, fixed-price engagements. | [HodlStay](https://hodlstay.com)'s production payment system, built end to end. |

Satoshi Gazette is the demo. A Bitcoin-only publication operated through the
system: not a mockup, not a pitch deck, a running business you can read right
now.

**[Founder profile](https://maydalabs.com/profile)** · **[Selected work](https://maydalabs.com/case-studies)** · **[What do you need?](https://maydalabs.com/contact)**

## What this repository is

The MaydaLabs platform: the public marketing surface, an authenticated client
portal, the pilot intake and review workflow, and an on-chain Bitcoin invoicing
path that takes payment without a processor and without a custodial server.

It is also the honest answer to "show me your code." Everything below is in
this repository and can be read rather than taken on trust.

## Where to look in this codebase

If you are here to judge the engineering rather than the studio, start with
these:

| Path | Why it is worth opening |
| --- | --- |
| `tests/rls.integration.test.ts` | Row-level security and grants exercised against a real local Supabase stack, through the real Data API, with real user sessions and negative cases. Not mocks. |
| `lib/payments.ts` | Invoice vocabulary and pure money helpers. Sats are rounded up so an invoice is never short of the price it quotes, and the module stays import-free so client components can render from it. |
| `lib/bitcoinAddress.ts` | Address checksum validation, run by the server action before anything is written. |
| `lib/supabase/` | Server and browser clients, typed against a generated database schema. |
| `lib/rateLimit.ts` | Rate limiting on the public intake path. |
| `app/[lang]/` | Localized routing and metadata composition across English, Turkish, and French. |
| `lib/i18n.ts`, `lib/metadata.ts` | Localization and metadata kept out of presentation. |
| `scripts/smoke.mjs` | Dependency-free production verification: routes, redirects, localized metadata, robots, sitemap, social images, and the public telemetry response. |

## Human-controlled automation

The same operating discipline appears in the private research, editorial, and
production systems around the public products. AI can help qualify evidence,
retrieve context, and prepare a draft, while exact consequential actions remain
behind a human approval gate and are verified after execution.

```mermaid
flowchart LR
    A[Capture<br/>source + provenance] --> B[Qualify<br/>rules + hard gates]
    B --> C[Assist<br/>research + draft]
    C --> D{Human approval<br/>exact payload + target}
    D -->|approved| E[Act<br/>bounded external write]
    D -->|revise| C
    E --> F[Verify<br/>destination + factual record]
```

- Evidence and provenance travel with the record.
- Autonomous external writes are off by default.
- Application, publication, and outreach payloads stay reviewable before action.
- The system records what factually happened, rather than assuming success.

## Selected work

### HodlStay

A Bitcoin-native accommodation marketplace delivered as a client product build,
from product strategy and booking architecture through payments, localization,
SEO, analytics, lifecycle communication, and operational handover.

- [Visit HodlStay](https://hodlstay.com)
- [Read the case study](https://maydalabs.com/case-studies/hodlstay)

### Satoshi Gazette

A Bitcoin intelligence and publishing product combining source intake,
evidence-aware editorial workflows, wire and story production, briefings,
primary-evidence data desks, and approval-gated distribution. MaydaLabs owns
the product; the guarded Ask Satoshi retrieval foundation, newsroom tooling,
and operational data remain behind the public surface.

- [Visit Satoshi Gazette](https://satoshigazette.org)
- [Read the case study](https://maydalabs.com/case-studies/satoshi-gazette)

### Mortal Vault — private alpha

A self-custodial continuity vault with owner check-ins, delayed beneficiary
claims, an owner challenge window, event-backed history, and explicit security
release gates. Contracts are unaudited and must not hold meaningful funds.

- [Read the work-in-progress case](https://maydalabs.com/case-studies/mortal-vault)

### Sofra — private Phase 1

A Türkiye-first managed marketplace for scheduled dinners in verified
households. The product connects bilingual guest, host, and operator journeys
while keeping exact household and safety data out of public projections. It is
demo-safe and does not claim a public launch or real payments.

- [Read the work-in-progress case](https://maydalabs.com/case-studies/sofra)

## Product proof, side by side

<table>
  <tr>
    <td width="50%"><img src="public/work/hodlstay-2026-09-home.jpg" alt="HodlStay live marketplace" /></td>
    <td width="50%"><img src="public/work/satoshi-gazette-2026-09-data.jpg" alt="Satoshi Gazette evidence-led Data Desk" /></td>
  </tr>
  <tr>
    <td><strong>HodlStay</strong><br />Marketplace, payments, operations, lifecycle, and growth.</td>
    <td><strong>Satoshi Gazette</strong><br />Editorial UX, evidence, retrieval, publishing, and guarded distribution.</td>
  </tr>
</table>

## MaydaOS, the interface lab

Before the platform rebuild, this site ran as a small operating system in the
browser. That build is preserved as a lab at
[maydalabs.com/os](https://maydalabs.com/os) rather than as the front door,
because a studio site should answer a buyer's question before it shows off.

It remains a fair sample of interface engineering: draggable, snappable windows
over a persisted desktop layout, a dock, a menubar, a ⌘K command palette, a
guided command shell, live telemetry that reads Bitcoin block height from
mempool.space, and a three.js wallpaper engine capped so ambience never taxes
the page, with full reduced-motion support.

![MaydaOS interface lab](docs/awards/01-desktop-globe.png)

> These captures predate the current positioning. The interface is accurate;
> the copy inside the windows is from the earlier build.

## Architecture

```text
app/[lang]/       Localized pages, metadata, and route composition
app/[lang]/portal Authenticated client portal
app/[lang]/os     The MaydaOS interface lab
app/api/          Public telemetry endpoint
components/       Interface, forms, diagrams, and case-study components
lib/              Payments, Bitcoin address validation, Supabase clients,
                  localization, metadata, analytics, and rate limiting
public/           Brand and case-study assets approved for public display
docs/             Product, launch, commercial, and brand documentation
scripts/          Dependency-free production verification
tests/            Vitest unit tests and the Supabase RLS integration suite
```

## Run locally

Requirements: a current Node.js LTS release and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Before a production
change, run:

```bash
npm run lint
npm run test
npm run build
npm run smoke:live
```

`smoke:live` checks production routes, redirects, localized metadata, robots,
the sitemap, social images, and the public telemetry response. Set
`SMOKE_BASE_URL` and `SMOKE_CANONICAL_URL` to inspect another deployment.

The RLS integration suite skips itself unless a local Supabase stack is
running. Start one with `npx supabase start` and provide the keys through
`.env.local` to exercise it.

The repository includes an environment-variable example file. Never commit
real credentials or private operational data.

## Evidence boundaries

- HodlStay is client work and is described only to the extent publicly approved.
- Satoshi Gazette is a MaydaLabs product; its internal newsroom runtime and automation remain private.
- Mortal Vault is an unaudited private alpha; no mainnet readiness or meaningful-funds claim is made.
- Sofra is a private Phase 1 build; demo records are not represented as real people, bookings, or payments.
- Case-study language distinguishes shipped work from planned or ongoing work.
- No client secret, credential, private dataset, or application record belongs in this repository.

## Contact

- [MaydaLabs](https://maydalabs.com)
- [LinkedIn](https://www.linkedin.com/in/mehmet-e-mayda/)
- [Email](mailto:info@maydalabs.com)

## License

Released under the [MIT License](LICENSE). The brand assets under
`public/logos/`, `public/profile/`, and `docs/brand/` are not covered by it.
