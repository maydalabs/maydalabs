import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DeleteMapButton,
  ProfileForm,
  SignOutButton,
  SubscriptionForm,
} from "@/components/PortalPanels";
import { MAP_COPY } from "@/components/multiplierMapCopy";
import { PILOT_COPY } from "@/components/pilotCopy";
import { PilotSummary, type PilotUpdateRecord } from "@/components/PilotView";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";
import type { MapOffer, MapPath } from "@/lib/multiplierMap";

const COPY = {
  en: {
    meta: {
      title: "Your portal",
      socialTitle: "Your portal · MaydaLabs",
      description: "Saved Multiplier Maps, submitted briefs, and your preferences.",
    },
    kicker: "Portal",
    heading: "Your maps, briefs, and preferences.",
    signedInAs: "Signed in as",
    signOut: "Sign out",
    mapsHeading: "Saved Multiplier Maps",
    mapsEmpty: "No saved maps yet. Run the Multiplier Map and save the result here.",
    mapsCta: "Run the Multiplier Map",
    view: "View",
    delete: "Delete",
    briefsHeading: "Submitted briefs",
    briefsEmpty: "No briefs yet. When you send one — from the map or the contact page — its status appears here.",
    statuses: {
      new: "Received",
      reviewing: "Being reviewed",
      needs_info: "Awaiting your reply",
      transferred: "In progress",
      closed: "Closed",
    } as Record<string, string>,
    subscriptionHeading: "Email updates",
    subscriptionNote:
      "Free, occasional product and build updates. No emails are being sent yet — your preference is stored and honored when sending starts.",
    subscription: {
      checkbox: "Send me occasional updates by email.",
      save: "Save preference",
      saved: "Saved",
      failed: "Saving failed. Try again.",
    },
    profileHeading: "Profile and privacy",
    profileNote:
      "Optional details that give your submissions context. Stored data: your email, these fields, saved maps, and submitted briefs — nothing else. To delete your account and data, email info@maydalabs.com from this address.",
    profile: {
      displayName: "Name",
      companyName: "Company",
      jobRole: "Role",
      save: "Save profile",
      saved: "Saved",
      failed: "Saving failed. Try again.",
    },
  },
  tr: {
    meta: {
      title: "Portalınız",
      socialTitle: "Portalınız · MaydaLabs",
      description: "Kayıtlı Multiplier Map'ler, gönderilmiş brief'ler ve tercihleriniz.",
    },
    kicker: "Portal",
    heading: "Haritalarınız, brief'leriniz ve tercihleriniz.",
    signedInAs: "Giriş yapan:",
    signOut: "Çıkış yap",
    mapsHeading: "Kayıtlı Multiplier Map'ler",
    mapsEmpty: "Henüz kayıtlı harita yok. Multiplier Map'i çalıştırın ve sonucu buraya kaydedin.",
    mapsCta: "Multiplier Map'i çalıştır",
    view: "Görüntüle",
    delete: "Sil",
    briefsHeading: "Gönderilen brief'ler",
    briefsEmpty: "Henüz brief yok. Haritadan veya iletişim sayfasından gönderdiğinizde durumu burada görünür.",
    statuses: {
      new: "Alındı",
      reviewing: "İnceleniyor",
      needs_info: "Yanıtınız bekleniyor",
      transferred: "Devam ediyor",
      closed: "Kapandı",
    } as Record<string, string>,
    subscriptionHeading: "E-posta güncellemeleri",
    subscriptionNote:
      "Ücretsiz, ara sıra ürün ve geliştirme güncellemeleri. Henüz e-posta gönderilmiyor — tercihiniz saklanır ve gönderim başladığında uygulanır.",
    subscription: {
      checkbox: "Bana ara sıra e-posta ile güncelleme gönderin.",
      save: "Tercihi kaydet",
      saved: "Kaydedildi",
      failed: "Kaydetme başarısız. Tekrar deneyin.",
    },
    profileHeading: "Profil ve gizlilik",
    profileNote:
      "Gönderimlerinize bağlam katan opsiyonel bilgiler. Saklanan veriler: e-postanız, bu alanlar, kayıtlı haritalar ve gönderilen brief'ler — başka bir şey yok. Hesabınızı ve verilerinizi silmek için bu adresten info@maydalabs.com'a yazın.",
    profile: {
      displayName: "Ad",
      companyName: "Şirket",
      jobRole: "Rol",
      save: "Profili kaydet",
      saved: "Kaydedildi",
      failed: "Kaydetme başarısız. Tekrar deneyin.",
    },
  },
  fr: {
    meta: {
      title: "Votre portail",
      socialTitle: "Votre portail · MaydaLabs",
      description: "Multiplier Maps enregistrées, briefs envoyés et vos préférences.",
    },
    kicker: "Portail",
    heading: "Vos cartes, briefs et préférences.",
    signedInAs: "Connecté en tant que",
    signOut: "Se déconnecter",
    mapsHeading: "Multiplier Maps enregistrées",
    mapsEmpty: "Aucune carte enregistrée. Lancez la Multiplier Map et enregistrez le résultat ici.",
    mapsCta: "Lancer la Multiplier Map",
    view: "Voir",
    delete: "Supprimer",
    briefsHeading: "Briefs envoyés",
    briefsEmpty: "Aucun brief pour l’instant. Quand vous en envoyez un — depuis la carte ou la page contact — son statut apparaît ici.",
    statuses: {
      new: "Reçu",
      reviewing: "En cours d’examen",
      needs_info: "En attente de votre réponse",
      transferred: "En cours",
      closed: "Clos",
    } as Record<string, string>,
    subscriptionHeading: "Nouvelles par e-mail",
    subscriptionNote:
      "Des nouvelles gratuites et occasionnelles des produits et des builds. Aucun e-mail n’est encore envoyé — votre préférence est enregistrée et respectée quand l’envoi commencera.",
    subscription: {
      checkbox: "Envoyez-moi des nouvelles occasionnelles par e-mail.",
      save: "Enregistrer la préférence",
      saved: "Enregistré",
      failed: "Échec de l’enregistrement. Réessayez.",
    },
    profileHeading: "Profil et confidentialité",
    profileNote:
      "Des détails optionnels qui donnent du contexte à vos envois. Données conservées : votre e-mail, ces champs, les cartes enregistrées et les briefs envoyés — rien d’autre. Pour supprimer votre compte et vos données, écrivez à info@maydalabs.com depuis cette adresse.",
    profile: {
      displayName: "Nom",
      companyName: "Entreprise",
      jobRole: "Rôle",
      save: "Enregistrer le profil",
      saved: "Enregistré",
      failed: "Échec de l’enregistrement. Réessayez.",
    },
  },
} as const;

export async function generateMetadata({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...COPY[locale].meta, path: "/portal", locale, socialCard: "portal" });
}

export default async function PortalPage({ params }: LocalePageProps) {
  const locale = await getPageLocale(params);
  const copy = COPY[locale];
  const mapCopy = MAP_COPY[locale];

  const claims = await getVerifiedClaims();
  if (!claims) redirect(localizePath("/auth/sign-in", locale));

  const supabase = await createSupabaseServerClient();
  const [
    { data: maps },
    { data: briefs },
    { data: profile },
    { data: subscription },
    { data: pilots },
    { data: pilotUpdates },
  ] =
    await Promise.all([
      supabase
        .from("multiplier_maps")
        .select("id, result, status, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("lead_intakes")
        .select("id, source, review_status, created_at")
        .eq("user_id", claims.sub)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("display_name, company_name, job_role").maybeSingle(),
      supabase.from("subscriptions").select("status").maybeSingle(),
      // RLS already scopes these; the explicit filters keep an operator's own
      // portal from showing the whole book.
      supabase
        .from("pilots")
        .select("id, company, workflow, offer, status, starts_on, ends_on, summary, next_step")
        .eq("client_user_id", claims.sub)
        .order("created_at", { ascending: false }),
      supabase
        .from("pilot_updates")
        .select("id, pilot_id, kind, title, body, period_label, output_count, approval_latency_minutes, source_coverage_pct, cost_usd, created_at")
        .eq("published", true)
        .order("created_at", { ascending: false }),
    ]);

  const pilotCopy = PILOT_COPY[locale];
  const updatesByPilot = new Map<string, PilotUpdateRecord[]>();
  for (const update of pilotUpdates ?? []) {
    const list = updatesByPilot.get(update.pilot_id) ?? [];
    list.push(update);
    updatesByPilot.set(update.pilot_id, list);
  }

  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <div className="mayda-shell mayda-section" style={{ maxWidth: "56rem" }}>
      <header className="mayda-portal-header">
        <div>
          <p className="mayda-kicker">{copy.kicker}</p>
          <h1 className="mayda-heading">{copy.heading}</h1>
          <p className="mayda-body" style={{ marginTop: "0.6rem" }}>
            {copy.signedInAs} <strong>{typeof claims.email === "string" ? claims.email : "—"}</strong>
          </p>
        </div>
        <SignOutButton locale={locale} label={copy.signOut} />
      </header>

      <section className="mayda-portal-section" aria-labelledby="portal-pilot">
        <h2 id="portal-pilot" className="mayda-subheading">
          {pilotCopy.sectionHeading}
        </h2>
        {pilots?.length ? (
          pilots.map((pilot) => (
            <PilotSummary
              key={pilot.id}
              pilot={pilot}
              updates={updatesByPilot.get(pilot.id) ?? []}
              locale={locale}
              compact
            />
          ))
        ) : (
          <div className="mayda-portal-empty">{pilotCopy.empty}</div>
        )}
      </section>

      <section className="mayda-portal-section" aria-labelledby="portal-maps">
        <h2 id="portal-maps" className="mayda-subheading">
          {copy.mapsHeading}
        </h2>
        {maps?.length ? (
          maps.map((map) => {
            const result = map.result as { path?: MapPath; offer?: MapOffer } | null;
            const pathTitle = result?.path ? mapCopy.paths[result.path]?.title : "—";
            const offerTitle = result?.offer ? mapCopy.offers[result.offer]?.title : "—";
            return (
              <div key={map.id} className="mayda-row">
                <div>
                  <strong>
                    {pathTitle} → {offerTitle}
                  </strong>
                  <small>{dateFormat.format(new Date(map.created_at))}</small>
                </div>
                <div className="flex items-center gap-3" style={{ flexDirection: "row" }}>
                  <Link
                    href={localizePath(`/portal/maps/${map.id}`, locale)}
                    className="mayda-text-link"
                  >
                    {copy.view}
                  </Link>
                  <DeleteMapButton mapId={map.id} label={copy.delete} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="mayda-portal-empty">
            {copy.mapsEmpty}{" "}
            <Link href={localizePath("/start", locale)} className="mayda-text-link">
              {copy.mapsCta} →
            </Link>
          </div>
        )}
      </section>

      <section className="mayda-portal-section" aria-labelledby="portal-briefs">
        <h2 id="portal-briefs" className="mayda-subheading">
          {copy.briefsHeading}
        </h2>
        {briefs?.length ? (
          briefs.map((brief) => (
            <div key={brief.id} className="mayda-row">
              <div>
                <strong>{brief.source === "multiplier_map" ? "Multiplier Map" : "Brief"}</strong>
                <small>{dateFormat.format(new Date(brief.created_at))}</small>
              </div>
              <span
                className={`mayda-status ${
                  brief.review_status === "new"
                    ? "is-new"
                    : brief.review_status === "closed"
                      ? "is-muted"
                      : "is-active"
                }`}
              >
                {copy.statuses[brief.review_status] ?? brief.review_status}
              </span>
            </div>
          ))
        ) : (
          <div className="mayda-portal-empty">{copy.briefsEmpty}</div>
        )}
      </section>

      <section className="mayda-portal-section" aria-labelledby="portal-subscription">
        <h2 id="portal-subscription" className="mayda-subheading">
          {copy.subscriptionHeading}
        </h2>
        <p className="mayda-body">{copy.subscriptionNote}</p>
        <SubscriptionForm
          locale={locale}
          copy={copy.subscription}
          initiallySubscribed={subscription?.status === "pending" || subscription?.status === "active"}
        />
      </section>

      <section className="mayda-portal-section" aria-labelledby="portal-profile">
        <h2 id="portal-profile" className="mayda-subheading">
          {copy.profileHeading}
        </h2>
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
