/**
 * Text Matcher & Normalization Utilities
 * Supports Azerbaijani (ə, ğ, ı, ö, ü, ş, ç, q, x), Turkish, and international alphabets.
 */

export function foldDiacritics(str) {
  if (!str) return '';
  return str
    .replace(/[\u0259\u018F]/g, 'e') // Azerbaijani ə, Ə -> e
    .replace(/[\u011E\u011F]/g, 'g') // ğ, Ğ -> g
    .replace(/[\u0130\u0131]/g, 'i') // İ, ı -> i
    .replace(/[\u00D6\u00F6]/g, 'o') // Ö, ö -> o
    .replace(/[\u00DC\u00FC]/g, 'u') // Ü, ü -> u
    .replace(/[\u015E\u015F]/g, 's') // Ş, ş -> s
    .replace(/[\u00C7\u00E7]/g, 'c') // Ç, ç -> c
    .replace(/[qQ]/g, 'k')          // Azerbaijani q -> k (haqqında <-> hakkında)
    .replace(/[xX]/g, 'h')          // Azerbaijani x -> h (xeyir <-> heyir)
    .replace(/[wW]/g, 'v');         // w -> v
}

export function normalizeWord(str) {
  if (!str) return '';
  return foldDiacritics(
    str
      .replace(/İ/g, 'i')
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
    'uh', 'um', 'ah', 'er', 'ııı', 'eee', 'mmm', 'hıı', 'hm', 'ee'
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

  // Comparison with collapsed consecutive double letters (e.g. haqqında -> hakkinda -> hakinda)
  const cs = ns.replace(/(.)\1+/g, '$1');
  const cc = nc.replace(/(.)\1+/g, '$1');
  if (cs === cc) return true;

  // Short words (1 to 3 letters, e.g. 'bu', 've', 'bir', 'biz', 'o')
  if (ns.length <= 3 || nc.length <= 3) {
    return ns === nc || cs === cc;
  }

  const minLen = Math.min(ns.length, nc.length);
  const maxLen = Math.max(ns.length, nc.length);
  const lenDiff = Math.abs(ns.length - nc.length);

  // Agglutinative suffix tolerance for words with length >= 4
  if ((nc.startsWith(ns) || ns.startsWith(nc) || cc.startsWith(cs) || cs.startsWith(cc)) && lenDiff <= 3 && (minLen / maxLen) >= 0.65) {
    return true;
  }

  // High-confidence similarity
  if ((minLen / maxLen) >= 0.65) {
    const sim = Math.max(
      levenshteinSimilarity(ns, nc),
      levenshteinSimilarity(cs, cc)
    );
    if (sim >= 0.75) return true;
  }

  return false;
}

export function detectScriptLanguage(text) {
  if (!text) return 'az-AZ';
  if (/[\u0259\u018F]/i.test(text) || /\b(bu gün|sizə|haqqında|layihə|xeyir|təqdimat|edirik|məlumat|verəcəyəm)\b/i.test(text)) {
    return 'az-AZ';
  }
  if (/\b(the|and|welcome|broadcast|tonight|this|you|with|script|camera)\b/i.test(text)) {
    return 'en-US';
  }
  return 'tr-TR';
}
