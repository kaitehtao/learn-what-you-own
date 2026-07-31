import type { ResearchCompany } from "./universe";

function searchWords(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/).filter(Boolean);
}

export function normalizedTicker(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function allWordsMatch(queryWords: string[], targetWords: string[]) {
  return queryWords.length > 0 && queryWords.every((queryWord) => targetWords.some((targetWord) => targetWord === queryWord || targetWord.startsWith(queryWord)));
}

export function companySearchScore(company: ResearchCompany, query: string) {
  const queryWords = searchWords(query);
  const tickerQuery = normalizedTicker(query);
  const ticker = normalizedTicker(company.ticker);
  if (ticker === tickerQuery) return 1000;
  if (ticker.startsWith(tickerQuery)) return 800;

  const companyWords = searchWords(company.name);
  if (companyWords.join(" ") === queryWords.join(" ")) return 700;
  if (allWordsMatch(queryWords, companyWords)) {
    return queryWords.every((queryWord) => companyWords.includes(queryWord)) ? 650 : 550;
  }

  const sectorWords = searchWords(company.sector);
  if (sectorWords.join(" ") === queryWords.join(" ")) return 450;
  if (allWordsMatch(queryWords, sectorWords)) return 350;

  const membershipWords = searchWords(company.memberships.join(" "));
  if (allWordsMatch(queryWords, membershipWords)) return 250;
  return 0;
}
