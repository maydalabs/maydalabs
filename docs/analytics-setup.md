# MaydaLabs Analytics Setup

## What works now

`@vercel/analytics` records page views and the site event layer records these conversion-intent actions:

| Event | Trigger | Properties |
| --- | --- | --- |
| `project_call_click` | Any Calendly project-call link | `surface` from `utm_content` |
| `contact_page_click` | Internal link to `/contact` | originating path |
| `case_study_click` | Internal case-study link | project slug |
| `flagship_outbound` | Link to HodlStay or Satoshi Gazette | project |
| `email_click` | `mailto:` link | address |
| `social_click` | LinkedIn link | network |

Events are sent to Vercel Analytics and pushed to `window.dataLayer`. Payloads contain only short, non-personal values.

## Activate Google Tag Manager

GTM is optional. Do not delay production or the first marketing posts for it.

1. Create a web container at [Google Tag Manager](https://tagmanager.google.com/).
2. Copy the container ID in the form `GTM-XXXXXXX`.
3. Add `NEXT_PUBLIC_GTM_ID` to the Production, Preview, and Development environments in Vercel.
4. Redeploy the project.
5. Open GTM Preview and confirm the events above appear in `dataLayer`.
6. Publish the GTM container only after the tags have been tested.

An invalid or missing ID loads no Google scripts. Never hardcode the real ID in source control.

## Advertising Later

When campaigns are ready, configure Google Ads or other pixels inside GTM rather than adding vendor scripts directly to the application. Treat `project_call_click` as the primary high-intent event. Do not mark lower-intent clicks as equal conversions.

Before paid traffic, also verify:

- Cookie/consent requirements for the countries being targeted.
- Conversion linker and cross-domain behavior for Calendly.
- UTM preservation from ad to site to scheduling.
- A production test booking that appears in both Calendly and analytics.
