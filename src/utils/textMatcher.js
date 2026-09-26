/**
 * Text Matcher & Normalization Utilities
 * Supports Azerbaijani (ə, ğ, ı, ö, ü, ş, ç), Turkish, and international alphabets.
 */

export function foldDiacritics(str) {
  if (!str) return '';
  return str
    .replace(/\u0259/g, 'e')
    .replace(/\u011F/g, 'g')
    .replace(/\u0131/g, 'i')
    .replace(/\u00F6/g, 'o')
    .replace(/\u00FC/g, 'u')
    .replace(/\u015F/g, 's')
    .replace(/\u00E7/g, 'c');
}

export function normalizeWord(str) {
  if (!str) return '';
  return foldDiacritics(
    str
      .replace(/\u0130/g, 'i')
      .replace(/I/g, '\u0131')
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'\u00AB\u00BB\u2018\u2019\u201C\u201D]/g, '')
      .trim()
  );
}

export function cleanAndTokenize(rawText) {
  if (!rawText) return [];
  const fillerWords = new Set([
    'uh', 'um', 'ah', 'er', 'ııı', 'eee', 'şey', 'yani', 'gibi',
    'the', 'a', 'an', 'and', 've', 'bir'
  ]);

  return rawText
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»'""]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0 && !fillerWords.has(t));
}

export function levenshteinSimilarity(s1, s2) {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  const m = s1.length, n = s2.length;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] = s1[i - 1] === s2[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    [prev, curr] = [curr, prev];
  }
  return 1.0 - prev[n] / Math.max(m, n);
}

export function isWordMatch(spoken, cleanWord) {
  if (!spoken || !cleanWord) return false;
  if (spoken === cleanWord) return true;

  const ns = normalizeWord(spoken);
  const nc = normalizeWord(cleanWord);
  if (ns && nc && ns === nc) return true;
  if (ns.length >= 4 && nc.length >= 4 && (nc.startsWith(ns) || ns.startsWith(nc))) return true;

  const lenRatio = Math.min(ns.length, nc.length) / Math.max(ns.length || 1, nc.length || 1);
  if (lenRatio < 0.5) return false;

  return Math.max(
    levenshteinSimilarity(spoken, cleanWord),
    levenshteinSimilarity(ns, nc)
  ) >= 0.72;
}
