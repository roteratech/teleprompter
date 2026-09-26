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
      .replace(/[\u2010-\u2015\u2026\u00AB\u00BB\u2018\u2019\u201C\u201D.,\/#!$%\^&\*;:{}=\-_`~()?"'<>\[\]\\|]/g, '')
      .trim()
  );
}

export function cleanAndTokenize(rawText) {
  if (!rawText) return [];
  // Only strip pure hesitation / non-verbal phonemes, never discard real linguistic words
  const hesitationSounds = new Set([
    'uh', 'um', 'ah', 'er', 'ııı', 'eee', 'mmm', 'hıı', 'hm'
  ]);

  return rawText
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2026\u00AB\u00BB\u2018\u2019\u201C\u201D.,\/#!$%\^&\*;:{}=\-_`~()?"'<>\[\]\\|]/g, ' ')
    .split(/\s+/)
    .map(t => normalizeWord(t))
    .filter(t => t.length > 0 && !hesitationSounds.has(t));
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
  if (!ns || !nc) return false;
  if (ns === nc) return true;

  // Strict constraint for short words (1 to 3 letters, e.g. 'bu', 've', 'bir', 'biz', 'o')
  // Short words MUST match exactly to prevent false leaps across the script
  if (ns.length <= 3 || nc.length <= 3) {
    return ns === nc;
  }

  const minLen = Math.min(ns.length, nc.length);
  const maxLen = Math.max(ns.length, nc.length);
  const lenDiff = Math.abs(ns.length - nc.length);

  // Controlled agglutinative suffix tolerance for words with length >= 4
  // Allows small suffix additions (e.g. layihe -> layihemiz) if ratio >= 0.70 and diff <= 3
  if ((nc.startsWith(ns) || ns.startsWith(nc)) && lenDiff <= 3 && (minLen / maxLen) >= 0.70) {
    return true;
  }

  // High-confidence similarity for minor transcription variance (threshold >= 0.80)
  if ((minLen / maxLen) >= 0.75) {
    const sim = levenshteinSimilarity(ns, nc);
    if (sim >= 0.80) return true;
  }

  return false;
}
