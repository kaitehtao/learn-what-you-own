import type { SecSubmissions } from "./secShareFacts";

export type SecProxyFiling = {
  form: string;
  accessionNumber: string;
  primaryDocument: string;
  filingDate: string;
  reportDate: string;
  sourceUrl: string;
};

export type SecProxyHolding = {
  securityClass: string;
  shares: number | null;
  sharesDisplay: string;
  percent: number | null;
  percentDisplay: string;
};

export type SecProxyBeneficialOwner = {
  name: string;
  category: string;
  holdings: SecProxyHolding[];
  totalPercent: number | null;
  totalPercentDisplay: string;
  sourceUrl: string;
};

export type ParsedSecProxyOwnership = {
  form: string;
  filingDate: string;
  asOfDate: string;
  sourceUrl: string;
  securityClasses: string[];
  people: SecProxyBeneficialOwner[];
};

const DEFINITIVE_PROXY_FORMS = /^(?:DEF 14A|DEF 14C)$/i;
function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&#8212;|&#8211;|&mdash;|&ndash;/gi, "—")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)));
}

function cleanCell(value: string) {
  return decodeHtml(value)
    .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tableRows(table: string) {
  return [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
    [...(row[1] ?? "").matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => cleanCell(cell[1] ?? "")),
  );
}

function numberValue(value: string) {
  const parsed = Number(value.replaceAll(",", "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function isPlaceholder(value: string) {
  return value === "—" || value === "-" || value === "–" || value === "*";
}

function valueTokens(cells: string[]) {
  const tokens: string[] = [];
  for (const cell of cells) {
    const normalized = cell.replace(/\s*%\s*/g, "%").trim();
    if (!normalized) continue;
    for (const token of normalized.match(/(?:\d[\d,]*(?:\.\d+)?%|\d[\d,]*(?:\.\d+)?|\*|—|–|-)/g) ?? []) tokens.push(token);
  }
  return tokens;
}

function displayPercent(value: string | undefined) {
  if (!value) return "Not reported";
  if (value === "*") return "Less than 1%";
  if (isPlaceholder(value)) return "—";
  return value.endsWith("%") ? value : `${value}%`;
}

function parseValuePairs(tokens: string[], classCount: number) {
  const pairs: Array<{ shares: string; percent: string }> = [];
  let index = 0;
  while (index < tokens.length && pairs.length < classCount) {
    const shares = tokens[index++] ?? "—";
    let percent = tokens[index++] ?? "—";
    if (percent === "%") percent = tokens[index++] ?? "—";
    pairs.push({ shares, percent });
  }
  return { pairs, remaining: tokens.slice(index) };
}

function securityClasses(header: string) {
  const classes = [...header.matchAll(/(?:Class\s+[A-Z0-9-]+\s+)?(?:Common|Ordinary)\s+(?:Stock|Shares)/gi)]
    .map((match) => cleanCell(match[0]).replace(/\s+/g, " "));
  const unique = [...new Set(classes.map((value) => value.replace(/^(Common Stock|Ordinary Shares)$/i, "Common Stock")))];
  const specific = unique.filter((value) => /^Class\s+/i.test(value));
  return (specific.length ? specific : unique).slice(0, 6);
}

function rowName(value: string) {
  return value
    .replace(/\((?:\d+|[a-z])\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function validOwnerName(value: string) {
  if (!/[A-Za-z]/.test(value) || value.length < 2 || value.length > 180) return false;
  return !/(?:name of beneficial owner|number|percent|common stock|ordinary shares|beneficial ownership|executive officers? and directors?\s*:?$|five percent|5% stockholders?\s*:?$)/i.test(value);
}

export function latestProxyFiling(cik: string, submissions: SecSubmissions): SecProxyFiling | null {
  const recent = submissions.filings?.recent;
  if (!recent?.form?.length) return null;
  for (let index = 0; index < recent.form.length; index += 1) {
    const form = recent.form[index] ?? "";
    if (!DEFINITIVE_PROXY_FORMS.test(form)) continue;
    const accessionNumber = recent.accessionNumber?.[index] ?? "";
    const primaryDocument = recent.primaryDocument?.[index] ?? "";
    if (!accessionNumber || !primaryDocument) continue;
    return {
      form,
      accessionNumber,
      primaryDocument,
      filingDate: recent.filingDate?.[index] ?? "",
      reportDate: recent.reportDate?.[index] ?? "",
      sourceUrl: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accessionNumber.replaceAll("-", "")}/${primaryDocument}`,
    };
  }
  return null;
}

export function parseSecProxyOwnershipHtml(html: string, filing: SecProxyFiling): ParsedSecProxyOwnership {
  const tableMatches = [...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)];
  const tableMatch = tableMatches.find((candidate) => {
    const text = cleanCell(candidate[1] ?? "");
    return /name of (?:beneficial owner|stockholder|shareholder)/i.test(text)
      && /(?:percent|percentage)/i.test(text)
      && /(?:common stock|ordinary shares)/i.test(text);
  });
  const table = tableMatch?.[1] ?? "";
  const precedingText = cleanCell(html.slice(Math.max(0, (tableMatch?.index ?? 0) - 40_000), tableMatch?.index ?? 0));
  const asOfMatches = [...precedingText.matchAll(/\bas of\s+((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2})/gi)];
  const asOfDate = asOfMatches.at(-1)?.[1] ?? filing.reportDate ?? filing.filingDate;
  if (!table) return { form: filing.form, filingDate: filing.filingDate, asOfDate, sourceUrl: filing.sourceUrl, securityClasses: [], people: [] };

  const rows = tableRows(table);
  const headerText = rows.slice(0, 6).flat().join(" ");
  const classes = securityClasses(headerText);
  const normalizedClasses = classes.length ? classes : ["Common Stock"];
  const people: SecProxyBeneficialOwner[] = [];
  let category = "Proxy-reported beneficial owner";

  for (const cells of rows) {
    const first = rowName(cells.find((cell) => cell.trim()) ?? "");
    const nonEmpty = cells.filter(Boolean);
    if (!first) continue;
    if (nonEmpty.length === 1 && /:\s*$/.test(first)) {
      category = first.replace(/:\s*$/, "");
      continue;
    }
    if (!validOwnerName(first)) continue;
    const tokens = valueTokens(cells.slice(cells.indexOf(cells.find((cell) => cell.trim()) ?? "") + 1));
    if (tokens.length < 2) continue;
    const { pairs, remaining } = parseValuePairs(tokens, normalizedClasses.length);
    const holdings = pairs.map((pair, index): SecProxyHolding => {
      const shares = isPlaceholder(pair.shares) ? null : numberValue(pair.shares);
      const percent = isPlaceholder(pair.percent) ? null : numberValue(pair.percent);
      return {
        securityClass: normalizedClasses[index] ?? `Security class ${index + 1}`,
        shares,
        sharesDisplay: isPlaceholder(pair.shares) ? "—" : pair.shares,
        percent,
        percentDisplay: displayPercent(pair.percent),
      };
    });
    if (!holdings.some((holding) => holding.shares !== null || holding.percentDisplay === "Less than 1%")) continue;
    const totalToken = remaining.find((token) => token.endsWith("%") || token === "*" || /^\d+(?:\.\d+)?$/.test(token));
    people.push({
      name: first,
      category,
      holdings,
      totalPercent: totalToken && !isPlaceholder(totalToken) ? numberValue(totalToken) : null,
      totalPercentDisplay: totalToken ? displayPercent(totalToken) : holdings.length === 1 ? holdings[0].percentDisplay : "Not separately reported",
      sourceUrl: filing.sourceUrl,
    });
  }

  return {
    form: filing.form,
    filingDate: filing.filingDate,
    asOfDate,
    sourceUrl: filing.sourceUrl,
    securityClasses: normalizedClasses,
    people: people.slice(0, 40),
  };
}
