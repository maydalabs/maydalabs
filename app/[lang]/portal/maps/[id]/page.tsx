import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MAP_COPY } from "@/components/multiplierMapCopy";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
import { localizePath } from "@/lib/i18n";
import { getPageLocale, type LocalePageProps } from "@/lib/localePage";
import { createPageMetadata } from "@/lib/metadata";
import type { MapResult } from "@/lib/multiplierMap";

const COPY = {
  en: {
    meta: {
      title: "Saved Multiplier Map",
      socialTitle: "Saved Multiplier Map · MaydaLabs",
      description: "A saved Multiplier Map result.",
    },
    back: "Back to portal",
    savedOn: "Saved on",
    rubric: "Rubric",
    discuss: "Discuss this map with MaydaLabs",
  },
  tr: {
    meta: {
      title: "Kayıtlı Multiplier Map",
      socialTitle: "Kayıtlı Multiplier Map · MaydaLabs",
      description: "Kayıtlı bir Multiplier Map sonucu.",
    },
    back: "Portala dön",
    savedOn: "Kayıt tarihi:",
    rubric: "Rubrik",
    discuss: "Bu haritayı MaydaLabs ile görüşün",
  },
  fr: {
    meta: {
      title: "Multiplier Map enregistrée",
      socialTitle: "Multiplier Map enregistrée · MaydaLabs",
      description: "Un résultat de Multiplier Map enregistré.",
    },
    back: "Retour au portail",
    savedOn: "Enregistrée le",
    rubric: "Rubrique",
    discuss: "Discuter de cette carte avec MaydaLabs",
  },
} as const;

type PageProps = LocalePageProps & { params: Promise<{ lang: string; id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const locale = await getPageLocale(params);
  return createPageMetadata({ ...COPY[locale].meta, path: "/portal", locale, socialCard: "portal" });
}

export default async function SavedMapPage({ params }: PageProps) {
  const locale = await getPageLocale(params);
  const { id } = await params;
  const copy = COPY[locale];
  const mapCopy = MAP_COPY[locale];

  const claims = await getVerifiedClaims();
  if (!claims) redirect(localizePath("/auth/sign-in", locale));

  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  // RLS scopes this read to the signed-in owner's rows.
  const supabase = await createSupabaseServerClient();
  const { data: map } = await supabase
    .from("multiplier_maps")
    .select("id, result, rubric_version, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!map) notFound();

  const result = map.result as unknown as MapResult;
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "long" });

  return (
    <div className="mayda-shell mayda-section" style={{ maxWidth: "44rem" }}>
      <div className="mayda-map-result">
        <div className="mayda-map-result-header">
          <Link href={localizePath("/portal", locale)} className="mayda-text-link" style={{ alignSelf: "flex-start" }}>
            ← {copy.back}
          </Link>
          <h1 className="mayda-heading">{mapCopy.resultHeading}</h1>
          <p className="mayda-mono" style={{ color: "var(--mist)" }}>
            {copy.savedOn} {dateFormat.format(new Date(map.created_at))} · {copy.rubric}{" "}
            {map.rubric_version}
          </p>
        </div>

        <div className="mayda-stack">
          <p className="mayda-kicker" style={{ margin: 0 }}>
            {mapCopy.pathLabel}
          </p>
          <h2 className="mayda-subheading">{mapCopy.paths[result.path].title}</h2>
          <p className="mayda-body">{mapCopy.paths[result.path].text}</p>
        </div>

        <div className="mayda-map-move">
          <p className="mayda-kicker" style={{ margin: 0 }}>
            {mapCopy.offerLabel}
          </p>
          <h2>{mapCopy.offers[result.offer].title}</h2>
          <p>{mapCopy.offers[result.offer].text}</p>
        </div>

        <div className="mayda-stack">
          <p className="mayda-kicker" style={{ margin: 0 }}>
            {mapCopy.focusLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {result.focus.map((capability, index) => (
              <span key={capability} className={`mayda-tag ${index === 0 ? "is-cobalt" : ""}`}>
                {mapCopy.capabilities[capability]}
              </span>
            ))}
          </div>
        </div>

        <div className="mayda-stack">
          <p className="mayda-kicker" style={{ margin: 0 }}>
            {mapCopy.stepsLabel}
          </p>
          <ol className="mayda-map-steps">
            {result.steps.map((step) => (
              <li key={step}>{mapCopy.steps[step]}</li>
            ))}
          </ol>
        </div>

        {result.notes.map((note) => (
          <p key={note} className="mayda-map-note">
            {mapCopy.notes[note]}
          </p>
        ))}

        <div>
          <Link href={localizePath("/contact", locale)} className="mayda-button">
            {copy.discuss} <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
