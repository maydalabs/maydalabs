"use client";

import { useActionState, useState } from "react";
import { removeModelSettingsAction, saveModelSettingsAction, setMonthlyCapAction } from "@/app/actions/model";
import type { EditResult } from "@/app/actions/cofounder";
import { KNOWN_MODEL_PRICES, PROVIDER_PRESETS, type ModelProvider, type ModelSettingsSummary } from "@/lib/osModelSettings";
import { notify } from "@/components/os/notice";

/* Choosing which AI answers, and paying for it yourself.
 *
 * The same shape as the company editor: a form sends the change and shows
 * what the server said. The key field is write-only. What comes back is the
 * provider, the model and the last four characters; the key itself is never
 * read back by anyone, including the person who typed it.
 */

export type ModelSettingsCopy = {
  heading: string; none: string; using: string; edit: string; preset: string; model: string; baseUrl: string; key: string; keyKeep: string;
  prices: string; cap: string; capHint: string; setCap: string; remove: string; removed: string; vaultLocked: string; saved: string; failed: string;
  reasons: Record<string, string>; save: string; cancel: string;
};

const START: EditResult = { error: null, version: 0 };
type PresetId = (typeof PROVIDER_PRESETS)[number]["id"];

function presetFor(summary: ModelSettingsSummary | null): PresetId {
  if (!summary) return "anthropic";
  if (summary.provider === "anthropic") return "anthropic";
  const match = PROVIDER_PRESETS.find((p) => p.provider === "openai_compatible" && p.baseUrl && summary.baseUrl?.startsWith(p.baseUrl));
  return match?.id ?? "compatible";
}

export function ModelSettingsEditor({ companyId, summary, monthlyCap, vaultReady, copy }: {
  companyId: string; summary: ModelSettingsSummary | null; monthlyCap: number; vaultReady: boolean; copy: ModelSettingsCopy;
}) {
  const [saveState, save, saving] = useActionState(async (previous: EditResult, formData: FormData) => {
    const result = await saveModelSettingsAction(previous, formData);
    if (!result.error) notify(copy.saved);
    return result;
  }, START);
  const [removeState, remove, removing] = useActionState(async (previous: EditResult, formData: FormData) => {
    const result = await removeModelSettingsAction(previous, formData);
    if (!result.error) notify(copy.removed);
    return result;
  }, START);
  const [capState, setCap, settingCap] = useActionState(setMonthlyCapAction, START);

  const [openedFor, setOpenedFor] = useState<number | null>(null);
  const [preset, setPreset] = useState<PresetId>(presetFor(summary));
  const [model, setModel] = useState(summary?.model ?? "claude-opus-5");
  const chosen = PROVIDER_PRESETS.find((p) => p.id === preset) ?? PROVIDER_PRESETS[0];
  const provider: ModelProvider = chosen.provider;
  const known = KNOWN_MODEL_PRICES[model.trim()];
  const open = openedFor !== null && (openedFor === saveState.version || saveState.error !== null);
  const refusal = (state: EditResult) => state.error ? (copy.reasons[state.error] ?? state.error) : null;

  const fill = (template: string, values: Record<string, string>) => Object.entries(values).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, () => v), template);

  return (
    <div className="mayda-stack" style={{ gap: "0.5rem" }}>
      <p className="mayda-kicker">{copy.heading}</p>
      <p className="mayda-body" style={{ margin: 0 }}>
        {summary
          ? fill(copy.using, { model: summary.model, last4: summary.keyLast4, input: `$${summary.price.inputUsdPerMillion}`, output: `$${summary.price.outputUsdPerMillion}` })
          : copy.none}
      </p>

      {!open ? (
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          <button type="button" className="os-doc-edit" onClick={() => { setPreset(presetFor(summary)); setModel(summary?.model ?? "claude-opus-5"); setOpenedFor(saveState.version); }}>
            {copy.edit}
          </button>
          {summary ? (
            <form action={remove}>
              <input type="hidden" name="companyId" value={companyId} />
              <button type="submit" className="os-doc-edit" disabled={removing}>{copy.remove}</button>
            </form>
          ) : null}
        </div>
      ) : (
        <form action={save} className="os-editor">
          <input type="hidden" name="companyId" value={companyId} />
          <input type="hidden" name="provider" value={provider} />
          <label className="mayda-field">
            <span>{copy.preset}</span>
            <select id="model-preset" value={preset} onChange={(e) => {
              const next = PROVIDER_PRESETS.find((p) => p.id === e.target.value) ?? PROVIDER_PRESETS[0];
              setPreset(next.id); setModel(next.model);
            }}>
              {PROVIDER_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
          <label className="mayda-field">
            <span>{copy.model}</span>
            <input id="model-name" name="model" value={model} onChange={(e) => setModel(e.target.value)} required maxLength={120} autoFocus />
          </label>
          {provider === "openai_compatible" ? (
            <label className="mayda-field">
              <span>{copy.baseUrl}</span>
              <input id="model-base-url" name="baseUrl" defaultValue={summary?.baseUrl ?? chosen.baseUrl ?? ""} required maxLength={300} inputMode="url" />
            </label>
          ) : null}
          <label className="mayda-field">
            <span>{copy.key}</span>
            <input id="model-key" name="apiKey" type="password" autoComplete="off" placeholder={summary ? copy.keyKeep : ""} maxLength={512} />
          </label>
          <div className="mayda-field">
            <span>{copy.prices}</span>
            <div style={{ display: "flex", gap: ".5rem" }}>
              <input id="model-price-in" name="inputPrice" inputMode="decimal" placeholder={known ? String(known.inputUsdPerMillion) : "in"} defaultValue={summary && summary.model === model ? String(summary.price.inputUsdPerMillion) : ""} style={{ width: "6rem" }} />
              <input id="model-price-out" name="outputPrice" inputMode="decimal" placeholder={known ? String(known.outputUsdPerMillion) : "out"} defaultValue={summary && summary.model === model ? String(summary.price.outputUsdPerMillion) : ""} style={{ width: "6rem" }} />
            </div>
          </div>
          {!vaultReady ? <p className="mayda-field-error" role="alert">{copy.vaultLocked}</p> : null}
          {open && saveState.error !== null && openedFor !== null && openedFor < saveState.version ? (
            <p className="mayda-field-error" role="alert">{fill(copy.failed, { reason: refusal(saveState) ?? "" })}</p>
          ) : null}
          <div className="os-editor-actions">
            <button type="submit" className="mayda-button" disabled={saving || !vaultReady}>{copy.save}</button>
            <button type="button" className="mayda-button mayda-button-outline" onClick={() => setOpenedFor(null)}>{copy.cancel}</button>
          </div>
        </form>
      )}
      {removeState.error ? <p className="mayda-field-error" role="alert">{fill(copy.failed, { reason: refusal(removeState) ?? "" })}</p> : null}

      {summary ? (
        <form action={setCap} className="os-editor" style={{ marginTop: ".4rem" }}>
          <input type="hidden" name="companyId" value={companyId} />
          <label className="mayda-field">
            <span>{copy.cap}</span>
            <input id="model-cap" name="monthlyCap" inputMode="decimal" defaultValue={String(monthlyCap)} style={{ width: "6rem" }} />
          </label>
          <p className="mayda-note" style={{ margin: 0 }}>{copy.capHint}</p>
          {capState.error ? <p className="mayda-field-error" role="alert">{fill(copy.failed, { reason: refusal(capState) ?? "" })}</p> : null}
          <div className="os-editor-actions">
            <button type="submit" className="mayda-button mayda-button-outline" disabled={settingCap}>{copy.setCap}</button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
