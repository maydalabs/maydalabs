# MaydaLabs

I’m Mehmet E. Mayda, the founder and full-stack product builder behind
[MaydaLabs](https://maydalabs.com).

I build production web products and the systems around them: product flows,
marketplaces, payments, lifecycle email, analytics, technical SEO,
localization, content operations, and AI-assisted workflows with deliberate
human control.

This repository contains the MaydaLabs studio site. It is both the public home
of the studio and a compact example of how I approach product engineering:
clear positioning, multilingual information architecture, strong technical
foundations, measurable user journeys, and careful evidence boundaries.

## Selected work

### HodlStay

A Bitcoin-native accommodation marketplace delivered as a client product
build, from product strategy and booking architecture through payments,
localization, SEO, analytics, lifecycle communication, and operational
handover.

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

## What this codebase demonstrates

- Next.js App Router, React, TypeScript, and component-driven UI
- English, Turkish, and French routing with localized metadata
- Structured data, canonical URLs, sitemap, robots, and social cards
- Responsive product and case-study storytelling
- Vercel Analytics, Speed Insights, and conversion-path instrumentation
- Explicit separation between public proof and private client or operational data

## Architecture

```text
app/[lang]/       Localized pages, metadata, and route composition
components/       Shared navigation, analytics, and interface components
lib/              Localization, metadata, site, and marketing-link helpers
public/           Brand and case-study assets approved for public display
docs/             Supporting product and launch documentation
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
npm run build
```

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

This repository is presented as a portfolio artifact. No open-source license
is granted unless a `LICENSE` file is added explicitly.
