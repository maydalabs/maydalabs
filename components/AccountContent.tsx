import Link from "next/link";
import { DeleteMapButton, ProfileForm, SignOutButton, SubscriptionForm } from "@/components/PortalPanels";
import { MAP_COPY } from "@/components/multiplierMapCopy";
import { PORTAL_COPY } from "@/components/portalCopy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { localizePath, type Locale } from "@/lib/i18n";
import type { MapOffer, MapPath } from "@/lib/multiplierMap";

/** Account features stay available without a MaydaOS beta membership. */
export async function AccountContent({ locale, userId, email }: { locale: Locale; userId: string; email: string | null }) {
  const copy = PORTAL_COPY[locale];
  const mapCopy = MAP_COPY[locale];
  const supabase = await createSupabaseServerClient();

  const [{ data: maps }, { data: briefs }, { data: profile }, { data: subscription }] = await Promise.all([
    supabase.from("multiplier_maps").select("id, result, status, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase
      .from("lead_intakes")
      .select("id, source, review_status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("display_name, company_name, job_role").eq("id", userId).maybeSingle(),
    supabase.from("subscriptions").select("status").eq("user_id", userId).maybeSingle(),
  ]);

  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
      <div className="mayda-stack-lg">
        <header className="mayda-portal-header">
          <div>
            <p className="mayda-body">
              {copy.signedInAs} <strong>{email ?? "—"}</strong>
            </p>
          </div>
          <SignOutButton locale={locale} label={copy.signOut} />
        </header>

        <section className="mayda-stack" style={{ gap: "0.5rem" }}>
          <h3 className="mayda-kicker" style={{ margin: 0 }}>{copy.mapsHeading}</h3>
          {maps?.length ? (
            maps.map((map) => {
              const result = map.result as { path?: MapPath; offer?: MapOffer } | null;
              const pathTitle = result?.path ? mapCopy.paths[result.path]?.title : "—";
              const offerTitle = result?.offer ? mapCopy.offers[result.offer]?.title : "—";
              return (
                <div key={map.id} className="mayda-row">
                  <div>
                    <strong>{pathTitle} → {offerTitle}</strong>
                    <small>{dateFormat.format(new Date(map.created_at))}</small>
                  </div>
                  <div className="flex items-center gap-3" style={{ flexDirection: "row" }}>
                    <Link href={localizePath(`/portal/maps/${map.id}`, locale)} className="mayda-text-link">{copy.view}</Link>
                    <DeleteMapButton mapId={map.id} label={copy.delete} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="mayda-portal-empty">
              {copy.mapsEmpty}{" "}
              <Link href={localizePath("/start", locale)} className="mayda-text-link">{copy.mapsCta} →</Link>
            </div>
          )}
        </section>

        <section className="mayda-stack" style={{ gap: "0.5rem" }}>
          <h3 className="mayda-kicker" style={{ margin: 0 }}>{copy.briefsHeading}</h3>
          {briefs?.length ? (
            briefs.map((brief) => (
              <div key={brief.id} className="mayda-row">
                <div>
                  <strong>{brief.source === "multiplier_map" ? "Multiplier Map" : "Brief"}</strong>
                  <small>{dateFormat.format(new Date(brief.created_at))}</small>
                </div>
                <span className={`mayda-status ${brief.review_status === "new" ? "is-new" : brief.review_status === "closed" ? "is-muted" : "is-active"}`}>
                  {copy.statuses[brief.review_status] ?? brief.review_status}
                </span>
              </div>
            ))
          ) : (
            <div className="mayda-portal-empty">{copy.briefsEmpty}</div>
          )}
        </section>

        <section className="mayda-stack" style={{ gap: "0.5rem" }}>
          <h3 className="mayda-kicker" style={{ margin: 0 }}>{copy.subscriptionHeading}</h3>
          <p className="mayda-body">{copy.subscriptionNote}</p>
          <SubscriptionForm
            locale={locale}
            copy={copy.subscription}
            initiallySubscribed={subscription?.status === "pending" || subscription?.status === "active"}
          />
        </section>

        <section className="mayda-stack" style={{ gap: "0.5rem" }}>
          <h3 className="mayda-kicker" style={{ margin: 0 }}>{copy.profileHeading}</h3>
          <p className="mayda-body">{copy.profileNote}</p>
          <ProfileForm
            locale={locale}
            copy={copy.profile}
            initial={{
              displayName: profile?.display_name ?? "",
              companyName: profile?.company_name ?? "",
              jobRole: profile?.job_role ?? "",
            }}
          />
        </section>
      </div>
  );
}
