export const CONTRIBUTION_RESEARCH_BUCKET = "contribution-research-assets";
export const MAX_CONTRIBUTION_ASSET_BYTES = 20 * 1024 * 1024;

export type ContributionAssetType = "earnings_model" | "research_report";

export function normalizeGoogleSheetUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "docs.google.com") return null;
  const match = url.pathname.match(/^\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})\//);
  if (!match) return null;
  return {
    viewUrl: `https://docs.google.com/spreadsheets/d/${match[1]}/edit`,
    embedUrl: `https://docs.google.com/spreadsheets/d/${match[1]}/preview`,
  };
}

export function safeContributionFileName(value: string, fallback: string) {
  const clean = value.trim().replace(/[^a-zA-Z0-9._() -]/g, "-").replace(/\s+/g, " ").slice(0, 230);
  return clean || fallback;
}

export function isPdfSignature(bytes: Uint8Array) {
  return bytes.length >= 5
    && bytes[0] === 0x25
    && bytes[1] === 0x50
    && bytes[2] === 0x44
    && bytes[3] === 0x46
    && bytes[4] === 0x2d;
}

export function isZipSignature(bytes: Uint8Array) {
  return bytes.length >= 4
    && bytes[0] === 0x50
    && bytes[1] === 0x4b
    && ((bytes[2] === 0x03 && bytes[3] === 0x04) || (bytes[2] === 0x05 && bytes[3] === 0x06));
}

export function contributionAssetDescriptor(file: File, assetType: ContributionAssetType, bytes: Uint8Array) {
  const lowerName = file.name.toLowerCase();
  if (assetType === "research_report") {
    if (!lowerName.endsWith(".pdf") || !isPdfSignature(bytes)) return null;
    return { mimeType: "application/pdf", extension: "pdf", fileName: safeContributionFileName(file.name, "research-report.pdf") };
  }
  if (lowerName.endsWith(".xlsx") && isZipSignature(bytes)) {
    return { mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx", fileName: safeContributionFileName(file.name, "earnings-model.xlsx") };
  }
  if (lowerName.endsWith(".csv") && !bytes.slice(0, 1024).includes(0)) {
    return { mimeType: "text/csv", extension: "csv", fileName: safeContributionFileName(file.name, "earnings-model.csv") };
  }
  return null;
}
