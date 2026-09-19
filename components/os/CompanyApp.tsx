import { connectSiteLeadsAction } from "@/app/actions/cofounder";
import { ActionForm } from "@/components/os/ActionForm";
import { CompanyEditor } from "@/components/os/CompanyEditor";
import { OsPaneEmpty } from "@/components/os/OsPaneEmpty";
import { OS_DOCUMENT_COPY, OS_SHELL_COPY } from "@/components/osCopy";
import { currentCompany } from "@/lib/osCompany";
import { createSupabaseServerClient, getVerifiedClaims } from "@/lib/supabase/server";
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

  // The same company every other pane is showing, then the rest of its row.
  const current = await currentCompany(supabase);
  const { data: company } = current
    ? await supabase.from("os_companies").select("id, name, what_we_do, created_at").eq("id", current.id).maybeSingle()
    : { data: null };

  if (!company) return <OsPaneEmpty>{copy.companyNothing}</OsPaneEmpty>;

  const claims = await getVerifiedClaims();
  const [{ data: members }, { data: connection }, { data: operator }] = await Promise.all([
    supabase.from("os_company_members").select("user_id, role, created_at").eq("company_id", company.id),
    supabase.from("os_connections").select("active").eq("company_id", company.id).eq("kind", "maydalabs_site").maybeSingle(),
    /* Whether this person may change the routing: the operator view shows
     * a row to operators and nothing to anyone else. */
    supabase.from("operator_status").select("user_id").maybeSingle(),
  ]);
  const routed = connection?.active === true;
  /* Correcting the company is the owner's, because the policy admits only an
   * owner and a control that is always refused is a trap. */
  const isOwner = (members ?? []).some((m) => m.user_id === claims?.sub && m.role === "owner");

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

      {isOwner ? (
        <CompanyEditor
          companyId={company.id}
          name={company.name}
          whatWeDo={company.what_we_do ?? ""}
          copy={{
            edit: copy.companyEdit,
            nameLabel: copy.companyNameLabel,
            whatLabel: copy.companyWhat,
            // The same two words the document's editor uses; a desk with
            // two spellings of "Save" is a desk assembled from parts.
            save: OS_DOCUMENT_COPY[locale].save,
            cancel: OS_DOCUMENT_COPY[locale].cancel,
            failed: copy.companyEditFailed,
            saved: copy.companySaved,
          }}
        />
      ) : null}

      <div>
        <p className="mayda-kicker">{copy.companyPeople}</p>
        <p className="mayda-body" style={{ margin: 0 }}>
          {(members ?? []).length === 1
            ? `1 · ${(members ?? [])[0]?.role === "owner" ? copy.companyOwner : copy.companyMember}`
            : `${(members ?? []).length}`}
        </p>
      </div>

      {/* What arrives here from outside. The first source is the site's own
          lead form; an operator decides which company receives it, because
          the site's leads belong to exactly one. */}
      <div className="mayda-stack" style={{ gap: "0.4rem" }}>
        <p className="mayda-kicker">{copy.companyLeads}</p>
        <p className="mayda-body" style={{ margin: 0 }}>{routed ? copy.companyLeadsOn : copy.companyLeadsOff}</p>
        {operator ? (
          <ActionForm action={connectSiteLeadsAction} done={routed ? copy.companyLeadsOff : copy.companyLeadsOn}>
            <input type="hidden" name="companyId" value={company.id} />
            <input type="hidden" name="active" value={routed ? "off" : "on"} />
            <button type="submit" className="mayda-button mayda-button-outline">
              {routed ? copy.disconnectLeads : copy.connectLeads}
            </button>
          </ActionForm>
        ) : (
          <p className="mayda-note" style={{ margin: 0 }}>{copy.leadsOperator}</p>
        )}
      </div>
    </div>
  );
}
