export function parseFinancialNumber(value: string | null | undefined) {
  const normalized = (value ?? "").trim();
  if (!normalized || /^(?:—|-|n\/?a|not available)$/i.test(normalized)) return null;
  const parenthetical = normalized.startsWith("(") && normalized.endsWith(")");
  const numeric = Number(normalized.replace(/[$,%(),\s]/g, ""));
  if (!Number.isFinite(numeric)) return null;
  return parenthetical ? -numeric : numeric;
}

export function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[midpoint] : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

export function standardDeviation(values: number[]) {
  if (values.length < 2) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function safeSurprisePercent(actual: number | null, consensus: number | null) {
  if (actual === null || consensus === null || Math.abs(consensus) < 0.01) return null;
  return ((actual - consensus) / Math.abs(consensus)) * 100;
}
