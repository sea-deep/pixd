/**
 * Word boundaries and pattern lists for detecting NSFW/adult content in prompts.
 */

const LEET_MAP: Record<string, string> = {
  "@": "a",
  "$": "s",
  "0": "o",
  "1": "i",
  "!": "i",
  "3": "e",
  "5": "s",
  "7": "t",
  "8": "b",
};

/**
 * Root words and unequivocal explicit terms.
 * Checked as word prefix or whole word (\b<word>).
 */
const EXACT_OR_ROOT_WORDS = [
  // General Adult / NSFW / Erotica
  "nsfw",
  "porn",
  "porno",
  "pornography",
  "pornhub",
  "xvideos",
  "xnxx",
  "xhamster",
  "hentai",
  "ecchi",
  "ahegao",
  "lewd",
  "erotic",
  "erotica",
  "rule34",
  "r34",
  "fetish",
  "bdsm",
  "bondage",
  "sadomasochism",

  // Nudity / Exposure
  "nude",
  "nudes",
  "nudity",
  "naked",
  "topless",
  "bottomless",
  "cameltoe",
  "nipslip",

  // Anatomy / Explicit Body Parts
  "boob",
  "boobs",
  "boobie",
  "boobies",
  "bobs",
  "tits",
  "titty",
  "titties",
  "tities",
  "breasts",
  "nipple",
  "nipples",
  "pussy",
  "pussies",
  "vagina",
  "vaginal",
  "vagene",
  "clit",
  "clitoris",
  "penis",
  "penises",
  "phallus",
  "dildo",
  "dildos",
  "vibrator",
  "buttplug",
  "asshole",
  "anus",
  "foreskin",
  "scrotum",
  "testicle",
  "testicles",

  // Sexual Acts / Fluids
  "intercourse",
  "copulation",
  "fornication",
  "masturbat",
  "masturbation",
  "masturbating",
  "jerkoff",
  "jerkingoff",
  "blowjob",
  "handjob",
  "footjob",
  "rimjob",
  "cumshot",
  "creampie",
  "bukkake",
  "deepthroat",
  "semen",
  "ejaculat",
  "ejaculation",
  "orgasm",
  "orgasms",
  "gangbang",
  "orgy",
  "threesome",
  "foursome",
  "stripper",
  "stripping",
  "striptease",

  // Lingerie / Underwear
  "lingerie",
  "thong",
  "panties",
  "panty",
  "g-string",
  "bikini",

  // Archetypes & Platforms
  "milf",
  "dilf",
  "camgirl",
  "onlyfans",
  "playboy",
  "penthouse",
  "futanari",
  "shemale",
  "yiff",
  "prostitute",
  "prostitution",
  "escort",

  // Hinglish / Indian explicit terms
  "choot",
  "chut",
  "chootiya",
  "gaand",
  "gand",
  "lund",
  "loda",
  "lauda",
  "muth",
  "mutthal",
  "randi",
  "chudai",
  "chodna",
  "boobita",
];

/**
 * Strict boundary patterns for terms that can be sub-strings of harmless words.
 */
const BOUNDED_PATTERNS: RegExp[] = [
  /\bsex\b/i,
  /\bsexy\b/i,
  /\bsexual\b/i,
  /\bsexually\b/i,
  /\bass\b/i,
  /\basses\b/i,
  /\btit\b/i,
  /\bcum\b/i,
  /\bcums\b/i,
  /\bcumming\b/i,
  /\bdick\b/i,
  /\bdicks\b/i,
  /\bcock\b/i,
  /\bcocks\b/i,
  /\banal\b/i,
  /\banally\b/i,
  /\bwhore\b/i,
  /\bwhores\b/i,
  /\bslut\b/i,
  /\bsluts\b/i,
  /\bslutty\b/i,
  /\byaoi\b/i,
  /\byuri\b/i,
  /\bincest\b/i,
  /\bhorny\b/i,
  /\bsmut\b/i,
  /\bhardcore\b/i,
  /\bsoftcore\b/i,
  /\bstrip\s+club\b/i,
  /\bjerk\s*off\b/i,
  /\brule\s*34\b/i,
  /\bx-?rated\b/i,
  /\bwithout\s+clothes\b/i,
  /\bno\s+clothes\b/i,
  /\bno\s+bra\b/i,
  /\bbra\s*less\b/i,
  /\bpantless\b/i,
  /\bshirtless\b/i,
  /\bunclothed\b/i,
  /\bundress(ed)?\b/i,
];

/**
 * Normalizes text for matching by:
 * 1. Lowercasing
 * 2. Replacing common leetspeak substitutions
 * 3. Collapsing spaced-out single characters (e.g. "p o r n" -> "porn")
 * 4. Replacing punctuation with whitespace
 */
function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  normalized = normalized.replace(/[@$01!3578]/g, (char) => LEET_MAP[char] || char);
  normalized = normalized.replace(/\b([a-z0-9])\s+(?=[a-z0-9]\b)/gi, "$1");
  normalized = normalized.replace(/[^a-z0-9\s]/gi, " ");
  return normalized;
}

/**
 * Checks if a given query or prompt contains NSFW / adult keywords or patterns.
 */
export function isNsfwQuery(prompt: string): boolean {
  if (!prompt || typeof prompt !== "string") return false;

  const raw = prompt.toLowerCase();

  // 1. Direct pattern check on raw input
  for (const pattern of BOUNDED_PATTERNS) {
    if (pattern.test(raw)) return true;
  }
  for (const word of EXACT_OR_ROOT_WORDS) {
    if (new RegExp(`\\b${word}`, "i").test(raw)) return true;
  }

  // 2. Normalized check (leetspeak, spaced characters, cleaned symbols)
  const normalized = normalizeText(prompt);
  for (const pattern of BOUNDED_PATTERNS) {
    if (pattern.test(normalized)) return true;
  }
  for (const word of EXACT_OR_ROOT_WORDS) {
    if (new RegExp(`\\b${word}`, "i").test(normalized)) return true;
  }

  return false;
}
