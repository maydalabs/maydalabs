import { OsPaneEmpty } from "@/components/os/OsPaneEmpty";
import { OS_SHELL_COPY } from "@/components/osCopy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Locale } from "@/lib/i18n";

/* What MaydaOS knows about you.
 *
 * The first of the four properties, made visible. It is deliberately a plain
 * reading of what is actually stored rather than a summary: the value of
 * "it knows your company" collapses the moment a person cannot check what it
 * thinks it knows.
 */
export async function CompanyApp({ locale }: { locale: Locale }) {
  if (!isSupabaseConfigured()) return null;
  const copy = OS_SHELL_COPY[locale];
  const supabase = await createSupabaseServerClient();

  const { data: company } = await supabase
    .from("os_companies")
    .select("id, name, what_we_do, created_at")
    .limit(1)
    .maybeSingle();

  if (!company) return <OsPaneEmpty>{copy.companyNothing}</OsPaneEmpty>;

  const { data: members } = await supabase
    .from("os_company_members")
    .select("user_id, role, created_at")
    .eq("company_id", company.id);

  return (
    <div className="mayda-stack" style={{ gap: "0.9rem" }}>
      {/* A stack, because .mayda-kicker is inline-flex — left to itself the
          label and the company name land on the same line on top of each
          other. */}
      <div className="mayda-stack" style={{ gap: "0.25rem" }}>
        <p className="mayda-kicker">{copy.companyHeading}</p>
        <strong style={{ fontSize: "1.05rem" }}>{company.name}</strong>
      </div>

      <div>
        <p className="mayda-kicker">{copy.companyWhat}</p>
        <p className="mayda-body" style={{ margin: 0 }}>
          {company.what_we_do || copy.companyWhatMissing}
        </p>
      </div>

      <div>
        <p className="mayda-kicker">{copy.companyPeople}</p>
        <p className="mayda-body" style={{ margin: 0 }}>
          {(members ?? []).length === 1
            ? `1 · ${(members ?? [])[0]?.role === "owner" ? copy.companyOwner : copy.companyMember}`
            : `${(members ?? []).length}`}
        </p>
      </div>
    </div>
  );
}
