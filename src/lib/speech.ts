// Speech recognition and scoring using the Web Speech API
// No external services, no API keys, no server

interface SpeechResult {
  transcript: string;
  stars: number;
  band: string;
  matchedKeywords: string[];
  unmatchedKeywords: string[];
}

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

function getRecognitionConstructor(): (new () => RecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return SR || null;
}

export function isSupported(): boolean {
  return getRecognitionConstructor() !== null;
}

export function listen(
  lang: string = 'en-US',
  onResult: (transcript: string) => void,
  onError: (error: string) => void,
  onEnd: () => void,
  /** Long-form speech (monologue, picture description) keeps listening across pauses. */
  continuous = false,
): { stop: () => void } {
  const SRCtor = getRecognitionConstructor();
  if (!SRCtor) {
    onError('unsupported');
    return { stop: () => {} };
  }

  const recognition = new SRCtor();
  recognition.lang = lang;
  recognition.continuous = continuous;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  recognition.onresult = (event: any) => {
    // In continuous mode each final segment arrives as its own result.
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) onResult(event.results[i][0].transcript);
    }
  };

  recognition.onerror = (event: any) => {
    onError(event.error || 'unknown');
  };

  recognition.onend = () => {
    onEnd();
  };

  try {
    recognition.start();
  } catch (e) {
    onError('start-failed');
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch (e) {
        // already stopped
      }
    },
  };
}

// Contractions are expanded BEFORE punctuation is stripped, so "i'm" spoken
// as "i am" (or either form in the keywords) matches after normalisation.
const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am',
  "you're": 'you are',
  "he's": 'he is',
  "she's": 'she is',
  "it's": 'it is',
  "we're": 'we are',
  "they're": 'they are',
  "that's": 'that is',
  "what's": 'what is',
  "let's": 'let us',
  "i've": 'i have',
  "i'll": 'i will',
  "can't": 'cannot',
  "won't": 'will not',
  "don't": 'do not',
  "doesn't": 'does not',
  "didn't": 'did not',
  "isn't": 'is not',
  "aren't": 'are not',
  "wasn't": 'was not',
  "weren't": 'were not',
};

const CONTRACTION_RE = new RegExp(`\\b(${Object.keys(CONTRACTIONS).map(k => k.replace("'", "'")).join('|')})\\b`, 'g');

// Normalise text: lowercase, expand contractions, accept keyword synonyms,
// then strip punctuation.
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(CONTRACTION_RE, m => CONTRACTIONS[m])
    .replace(/\btee shirt\b/g, 't-shirt')
    .replace(/\bt shirt\b/g, 't-shirt')
    .replace(/\btrousers\b/g, 'pants')
    .replace(/[.,!?;:'"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein distance (also used by typed-answer activities)
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

export function score(transcript: string, keywords: string[]): SpeechResult {
  const normalizedTranscript = normalize(transcript);
  const transcriptWords = normalizedTranscript.split(' ').filter(Boolean);

  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const keyword of keywords) {
    const normalizedKeyword = normalize(keyword);
    const keywordWords = normalizedKeyword.split(' ').filter(Boolean);

    let isMatched = false;
    for (const kw of keywordWords) {
      // Exact match
      if (transcriptWords.includes(kw)) {
        isMatched = true;
        break;
      }
      // Fuzzy match for longer words (5+ letters)
      if (kw.length >= 5) {
        for (const tw of transcriptWords) {
          if (levenshtein(kw, tw) <= 1) {
            isMatched = true;
            break;
          }
        }
      }
      if (isMatched) break;
    }

    if (isMatched) {
      matched.push(keyword);
    } else {
      unmatched.push(keyword);
    }
  }

  const total = keywords.length;
  const coverage = total > 0 ? matched.length / total : 0;

  let stars: number;
  let band: string;

  if (coverage >= 0.9) {
    stars = 3;
    band = 'Excellent — I heard everything clearly.';
  } else if (coverage >= 0.7) {
    stars = 2;
    band = 'Good — I heard most of it. Try once more for full marks.';
  } else {
    stars = 1;
    band = 'Keep going — here are the words I heard.';
  }

  return {
    transcript: normalizedTranscript,
    stars,
    band,
    matchedKeywords: matched,
    unmatchedKeywords: unmatched,
  };
}
