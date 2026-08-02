export type BarbaraResultKind =
  | "command"
  | "client"
  | "ecosystem"
  | "decision"
  | "practice";

export type BarbaraResult = {
  id: string;
  kind: BarbaraResultKind;
  title: string;
  subtitle: string;
  keywords: string[];
  priority?: number;
  action: () => void;
};

type SearchableBarbaraResult = BarbaraResult & {
  normalizedTitle: string;
  normalizedSubtitle: string;
  normalizedKeywords: string[];
};

const STOP_WORDS = new Set([
  "a",
  "al",
  "alla",
  "apri",
  "cerca",
  "con",
  "da",
  "del",
  "della",
  "di",
  "eccomi",
  "fammi",
  "il",
  "in",
  "la",
  "le",
  "mi",
  "mostra",
  "nel",
  "nella",
  "per",
  "su",
  "un",
  "una",
  "vai",
  "visualizza",
]);

export function normalizeBarbaraText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeBarbaraText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function prepareResult(result: BarbaraResult): SearchableBarbaraResult {
  return {
    ...result,
    normalizedTitle: normalizeBarbaraText(result.title),
    normalizedSubtitle: normalizeBarbaraText(result.subtitle),
    normalizedKeywords: result.keywords.map(normalizeBarbaraText),
  };
}

function scoreToken(token: string, result: SearchableBarbaraResult): number {
  if (result.normalizedTitle === token) return 120;
  if (result.normalizedTitle.startsWith(token)) return 90;
  if (result.normalizedTitle.includes(token)) return 70;

  const keywordScore = result.normalizedKeywords.reduce((best, keyword) => {
    if (keyword === token) return Math.max(best, 80);
    if (keyword.startsWith(token)) return Math.max(best, 65);
    if (keyword.includes(token) || token.includes(keyword)) return Math.max(best, 50);
    return best;
  }, 0);

  if (keywordScore > 0) return keywordScore;
  if (result.normalizedSubtitle.includes(token)) return 30;

  return 0;
}

function scoreResult(query: string, result: SearchableBarbaraResult): number {
  const normalizedQuery = normalizeBarbaraText(query);
  const tokens = tokenize(query);

  if (!normalizedQuery) return result.priority ?? 0;

  let score = result.priority ?? 0;

  if (result.normalizedTitle === normalizedQuery) score += 220;
  else if (result.normalizedTitle.startsWith(normalizedQuery)) score += 160;
  else if (result.normalizedTitle.includes(normalizedQuery)) score += 120;

  if (result.normalizedKeywords.some((keyword) => keyword === normalizedQuery)) {
    score += 150;
  }

  const matchedTokens = tokens.filter((token) => scoreToken(token, result) > 0);
  if (tokens.length > 0 && matchedTokens.length === 0) return 0;

  score += matchedTokens.reduce((total, token) => total + scoreToken(token, result), 0);

  if (tokens.length > 1 && matchedTokens.length === tokens.length) {
    score += 80;
  }

  return score;
}

export function searchBarbaraResults(
  query: string,
  results: BarbaraResult[],
  limit = 8,
): BarbaraResult[] {
  const prepared = results.map(prepareResult);

  return prepared
    .map((result) => ({ result, score: scoreResult(query, result) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.result.title.localeCompare(right.result.title, "it");
    })
    .slice(0, limit)
    .map(({ result }) => {
      const {
        normalizedTitle: _normalizedTitle,
        normalizedSubtitle: _normalizedSubtitle,
        normalizedKeywords: _normalizedKeywords,
        ...publicResult
      } = result;
      return publicResult;
    });
}

export function getBarbaraQuickActions(results: BarbaraResult[], limit = 6): BarbaraResult[] {
  return [...results]
    .filter((result) => result.kind === "command")
    .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))
    .slice(0, limit);
}

export function getBarbaraEmptyMessage(query: string): {
  title: string;
  description: string;
} {
  const normalizedQuery = normalizeBarbaraText(query);

  if (!normalizedQuery) {
    return {
      title: "Cosa vuoi fare?",
      description: "Cerca un cliente, una pratica, un ecosistema oppure avvia un'azione rapida.",
    };
  }

  return {
    title: `Nessun risultato per “${query.trim()}”`,
    description: "Prova con un nome, un codice pratica o un comando come “Apri Decision Center”.",
  };
}
