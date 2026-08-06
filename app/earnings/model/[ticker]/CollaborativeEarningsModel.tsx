"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  aggregateMedianInputs,
  deriveEarningsModelPeriod,
  earningsModelDerived,
  earningsModelInputs,
  earningsModelPeriods,
  type EarningsModelAggregateMap,
  type EarningsModelCellMap,
  type EarningsModelInputKey,
  type EarningsModelPeriodKey,
} from "../../../earnings-model";
import { authenticatedFetch, loginPath } from "../../../supabase-browser";

type StringCells = Partial<Record<EarningsModelPeriodKey, Partial<Record<EarningsModelInputKey, string>>>>;
type OwnModel = {
  fiscalQuarter: string;
  thesisCase: "bull" | "base" | "bear";
  confidence: number;
  assumptionNote: string;
  sourceUrl: string;
  version: number;
  updatedAt: string;
  cells: EarningsModelCellMap;
};
type Revision = { period_key: string; metric_key: string; old_value: number | null; new_value: number | null; version: number; changed_at: string };
type ModelResponse = {
  locked: boolean;
  aggregate: EarningsModelAggregateMap;
  stats: { participantCount: number; bullCount: number; baseCount: number; bearCount: number };
  street: { epsEstimate?: number | null; analystCount?: number | null; sourceLabel?: string; sourceUrl?: string; snapshotDate?: string } | null;
  result: { epsActual?: number | null; epsConsensusAtReport?: number | null; epsSurprisePercent?: number | null; sourceLabel?: string; sourceUrl?: string } | null;
  ownModel: OwnModel | null;
  revisions: Revision[];
  error?: string;
};

function displayNumber(value: number | null | undefined, unit: string) {
  if (value === null || value === undefined) return "—";
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "USD per share") return `${value < 0 ? "−" : ""}$${Math.abs(value).toFixed(2)}`;
  return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

function toStringCells(cells: EarningsModelCellMap | undefined) {
  const output: StringCells = {};
  for (const period of earningsModelPeriods) for (const metric of earningsModelInputs) {
    const value = cells?.[period.key]?.[metric.key];
    if (value === undefined) continue;
    output[period.key] ??= {};
    output[period.key]![metric.key] = String(value);
  }
  return output;
}

function toNumberCells(cells: StringCells) {
  const output: EarningsModelCellMap = {};
  for (const period of earningsModelPeriods) for (const metric of earningsModelInputs) {
    const raw = cells[period.key]?.[metric.key]?.trim();
    if (!raw) continue;
    const value = Number(raw);
    if (!Number.isFinite(value)) continue;
    output[period.key] ??= {};
    output[period.key]![metric.key] = value;
  }
  return output;
}

export function CollaborativeEarningsModel({ ticker, reportDate, fiscalQuarter, companyName }: {
  ticker: string;
  reportDate: string;
  fiscalQuarter: string;
  companyName: string;
}) {
  const router = useRouter();
  const [model, setModel] = useState<ModelResponse | null>(null);
  const [cells, setCells] = useState<StringCells>({});
  const [thesisCase, setThesisCase] = useState<"bull" | "base" | "bear">("base");
  const [confidence, setConfidence] = useState("3");
  const [assumptionNote, setAssumptionNote] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    authenticatedFetch(`/api/earnings/models?ticker=${encodeURIComponent(ticker)}&date=${encodeURIComponent(reportDate)}`)
      .then(async (response) => {
        const body = await response.json() as ModelResponse;
        if (!response.ok) throw new Error(body.error ?? "Unable to load the model.");
        if (!active) return;
        setModel(body);
        if (body.ownModel) {
          setCells(toStringCells(body.ownModel.cells));
          setThesisCase(body.ownModel.thesisCase);
          setConfidence(String(body.ownModel.confidence));
          setAssumptionNote(body.ownModel.assumptionNote);
          setSourceUrl(body.ownModel.sourceUrl);
        }
      })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "Unable to load the model."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reportDate, ticker]);

  const ownNumericCells = useMemo(() => toNumberCells(cells), [cells]);
  const ownDerived = useMemo(() => Object.fromEntries(earningsModelPeriods.map((period) => [period.key, deriveEarningsModelPeriod(ownNumericCells[period.key] ?? {})])) as Record<EarningsModelPeriodKey, ReturnType<typeof deriveEarningsModelPeriod>>, [ownNumericCells]);
  const crowdDerived = useMemo(() => Object.fromEntries(earningsModelPeriods.map((period) => [period.key, deriveEarningsModelPeriod(aggregateMedianInputs(model?.aggregate ?? {}, period.key))])) as Record<EarningsModelPeriodKey, ReturnType<typeof deriveEarningsModelPeriod>>, [model?.aggregate]);

  function changeCell(period: EarningsModelPeriodKey, metric: EarningsModelInputKey, value: string) {
    setCells((current) => ({ ...current, [period]: { ...(current[period] ?? {}), [metric]: value } }));
  }

  function startFromCrowd() {
    const next: StringCells = {};
    for (const period of earningsModelPeriods) for (const metric of earningsModelInputs) {
      const value = model?.aggregate[period.key]?.[metric.key]?.median;
      if (value === null || value === undefined) continue;
      next[period.key] ??= {};
      next[period.key]![metric.key] = String(value);
    }
    setCells(next);
    setMessage("Your private draft now starts from the current community medians. Save to publish it into the aggregate.");
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await authenticatedFetch("/api/earnings/models", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticker, reportDate, fiscalQuarter, thesisCase, confidence: Number(confidence), assumptionNote, sourceUrl, cells: ownNumericCells }),
      });
      const body = await response.json() as { error?: string; model?: ModelResponse };
      if (response.status === 401) {
        router.push(loginPath(`/earnings/model/${ticker.toLowerCase()}?date=${encodeURIComponent(reportDate)}&quarter=${encodeURIComponent(fiscalQuarter)}&company=${encodeURIComponent(companyName)}`));
        return;
      }
      if (!response.ok || !body.model) throw new Error(body.error ?? "Unable to save the model.");
      setModel(body.model);
      setCells(toStringCells(body.model.ownModel?.cells));
      setMessage("Model saved. Anonymous community medians and ranges are updated while your detailed cells remain private.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save the model.");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <section className="earnings-model-hero"><div className="container">
      <div><span className="kicker">COLLABORATIVE EARNINGS WORKBOOK</span><h1>{ticker} earnings model</h1><p>{companyName} · {fiscalQuarter || "Fiscal period pending"} · reports {reportDate}</p></div>
      <div className="earnings-model-hero-actions"><Link href={`/earnings?date=${reportDate}`}>← Earnings calendar</Link><Link href={`/workspace?ticker=${encodeURIComponent(ticker)}`}>Open private FACTS workspace</Link></div>
    </div></section>
    <section className="container earnings-model-shell">
      <div className="earnings-model-boundary"><div><strong>Public</strong><span>Anonymous crowd medians, ranges, dispersion, and participation.</span></div><div><strong>Private to you</strong><span>Your editable cells, assumptions, evidence link, and revision history.</span></div><div><strong>Locked after results</strong><span>Captured estimates become a scoreable point-in-time record.</span></div></div>
      {loading && <div className="earnings-state">Loading the latest shared model…</div>}
      {message && <div className={`earnings-model-message${message.startsWith("Unable") || message.startsWith("The ") ? " error" : ""}`}>{message}</div>}
      {model && <>
        <div className="earnings-model-scoreboard">
          <div><span>Contributors</span><strong>{model.stats.participantCount}</strong><small>{model.stats.bullCount} bull · {model.stats.baseCount} base · {model.stats.bearCount} bear</small></div>
          <div><span>Latest Street EPS</span><strong>{displayNumber(model.street?.epsEstimate, "USD per share")}</strong><small>{model.street?.analystCount ?? "—"} analysts · snapshot {model.street?.snapshotDate ?? "pending"}</small></div>
          <div><span>Status</span><strong>{model.locked ? "Locked" : "Open"}</strong><small>{model.locked ? "Actual result captured" : "Editable until reported"}</small></div>
          <div><span>Your version</span><strong>{model.ownModel?.version ?? "Draft"}</strong><small>{model.ownModel?.updatedAt ? `Updated ${new Date(model.ownModel.updatedAt).toLocaleString()}` : "Not yet saved"}</small></div>
        </div>
        <div className="earnings-model-toolbar"><div><h2>Operating model</h2><p>Enter absolute amounts in USD millions. Each cell shows the public median and observed range beneath your private estimate.</p></div><button type="button" onClick={startFromCrowd} disabled={!model.stats.participantCount || model.locked}>Start from crowd medians</button></div>
        <div className="earnings-model-table-wrap"><table className="earnings-model-table">
          <thead><tr><th>Metric</th>{earningsModelPeriods.map((period) => <th key={period.key}><strong>{period.label}</strong><span>{period.horizon}</span></th>)}</tr></thead>
          <tbody>{earningsModelInputs.map((metric) => <tr key={metric.key}><th><strong>{metric.label}</strong><span>{metric.unit}</span></th>{earningsModelPeriods.map((period) => {
            const crowd = model.aggregate[period.key]?.[metric.key];
            return <td key={period.key}><input aria-label={`${metric.label}, ${period.label}`} type="number" step="any" value={cells[period.key]?.[metric.key] ?? ""} onChange={(event) => changeCell(period.key, metric.key, event.target.value)} disabled={model.locked} placeholder="Your estimate" /><small>{crowd?.contributorCount ? <>Crowd <b>{displayNumber(crowd.median, metric.unit)}</b> · {displayNumber(crowd.low, metric.unit)}–{displayNumber(crowd.high, metric.unit)} · n={crowd.contributorCount}</> : "No crowd estimate yet"}</small></td>;
          })}</tr>)}</tbody>
        </table></div>
        <div className="earnings-model-derived"><header><span className="kicker">FORMULA OUTPUTS</span><h2>Margins, per-share earnings, and cash conversion</h2><p>These rows are calculated from trusted formulas; users cannot overwrite them.</p></header>
          <div className="earnings-model-table-wrap"><table className="earnings-model-table derived"><thead><tr><th>Calculated metric</th>{earningsModelPeriods.map((period) => <th key={period.key}>{period.label}</th>)}</tr></thead><tbody>
            {earningsModelDerived.map((metric) => <tr key={metric.key}><th><strong>{metric.label}</strong><span>{metric.unit}</span></th>{earningsModelPeriods.map((period) => <td key={period.key}><strong>{displayNumber(ownDerived[period.key][metric.key], metric.unit)}</strong><small>Crowd-derived {displayNumber(crowdDerived[period.key][metric.key], metric.unit)}</small></td>)}</tr>)}
          </tbody></table></div>
        </div>
        <div className="earnings-model-assumptions"><label>SCENARIO<select value={thesisCase} onChange={(event) => setThesisCase(event.target.value as "bull" | "base" | "bear")} disabled={model.locked}><option value="bull">Bull</option><option value="base">Base</option><option value="bear">Bear</option></select></label><label>CONFIDENCE<select value={confidence} onChange={(event) => setConfidence(event.target.value)} disabled={model.locked}>{[1,2,3,4,5].map((value) => <option key={value}>{value}</option>)}</select></label><label className="wide">KEY ASSUMPTIONS<textarea minLength={12} maxLength={1500} value={assumptionNote} onChange={(event) => setAssumptionNote(event.target.value)} disabled={model.locked} placeholder="Explain the volume, pricing, margin, share-count, or cash-flow assumptions that drive your model." /></label><label className="wide">CITE PRIMARY EVIDENCE · OPTIONAL<input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} disabled={model.locked} placeholder="https://investor.company.com/..." /></label></div>
        <div className="earnings-model-save"><p>{model.locked ? "This model is read-only because an actual result has been captured." : "Saving publishes only anonymous aggregate statistics. Your cells and notes remain private to your account."}</p><button type="button" onClick={() => void save()} disabled={model.locked || saving}>{saving ? "Saving model…" : model.ownModel ? "Save new revision" : "Publish my model"}</button></div>
        {model.revisions.length > 0 && <details className="earnings-model-revisions"><summary>Your revision history ({model.revisions.length} recent cell changes)</summary><div>{model.revisions.map((revision, index) => <article key={`${revision.period_key}-${revision.metric_key}-${revision.version}-${index}`}><span>{revision.changed_at}</span><strong>{revision.period_key.replaceAll("_", " ")} · {revision.metric_key.replaceAll("_", " ")}</strong><small>{revision.old_value ?? "blank"} → {revision.new_value ?? "cleared"} · v{revision.version}</small></article>)}</div></details>}
        <div className="earnings-data-note"><strong>Research, not advice</strong><p>The crowd model is a transparent aggregation of member estimates, not a recommendation or audited forecast. Verify inputs against company filings, official earnings materials, and licensed estimate sources. Adjusted metrics can differ between contributors and companies; define them in your assumptions.</p></div>
      </>}
    </section>
  </>;
}
