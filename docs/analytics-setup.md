# MaydaLabs Analytics Setup

## What works now

Vercel Web Analytics records page views, Speed Insights measures real-user performance, and the site event layer emits these conversion-intent actions:

| Event | Trigger | Properties |
| --- | --- | --- |
| `project_call_click` | Any Calendly project-call link | `surface` from `utm_content` |
| `contact_page_click` | Internal link to `/contact` | originating path |
| `case_study_click` | Internal case-study link | project slug |
| `flagship_outbound` | Link to HodlStay or Satoshi Gazette | project |
| `email_click` | `mailto:` link | address |
| `social_click` | X, LinkedIn, or future Instagram link | network |

Events are sent to Vercel Analytics and pushed to `window.dataLayer`. Payloads contain only short, non-personal values.

Web Analytics page views and Speed Insights are available on every Vercel plan. Vercel's custom-event dashboard currently requires Pro or Enterprise. On Hobby, page/referrer reporting still works and `dataLayer` remains ready, but conversion-event reporting requires either a Vercel upgrade or a tested GTM/analytics destination before paid ads begin.

## Localization and campaign attribution

- English uses canonical unprefixed URLs. Turkish uses `/tr`; French uses `/fr`.
- The site does not redirect from country or browser-language signals. Visitors choose Turkish or French through explicit localized links.
- Language selection does not set a preference cookie; the selected locale remains visible in the URL.
- Inbound `utm_source`, `utm_medium`, `utm_campaign`, and `utm_term` values are retained for the browser session and forwarded to Calendly.
- Calendly `utm_content` remains the exact MaydaLabs CTA surface, such as `header` or `hodlstay_case_bottom`.

## Activate Google Tag Manager

GTM is optional. Vercel Analytics and Speed Insights are the launch baseline; do not delay production or organic posts for GTM.

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
