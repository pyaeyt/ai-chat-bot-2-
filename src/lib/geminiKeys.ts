/**
 * Multiple Gemini API keys: GEMINI_API_KEYS1, GEMINI_API_KEYS2, … (any order in env).
 * Scans GEMINI_API_KEYS1 … GEMINI_API_KEYS32 — never commit real keys.
 * Falls back to GEMINI_API_KEY for a single key.
 */

const NUMBERED_KEY_MAX = 32

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

export function getGeminiApiKeys(): string[] {
  const numbered: string[] = []
  for (let n = 1; n <= NUMBERED_KEY_MAX; n++) {
    const v = process.env[`GEMINI_API_KEYS${n}`]?.trim()
    if (v) numbered.push(v)
  }

  if (numbered.length > 0) {
    return [...new Set(numbered)]
  }

  const single = process.env.GEMINI_API_KEY?.trim()
  return single ? [single] : []
}

/** Random order each call so load spreads across keys; caller retries on rate limit. */
export function shuffledGeminiKeys(): string[] {
  const keys = getGeminiApiKeys()
  return shuffleInPlace([...keys])
}

export function isGeminiRateLimitError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
  if (
    msg.includes('429') ||
    msg.includes('resource exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  ) {
    return true
  }
  const code = (err as { status?: number; code?: number })?.status ?? (err as { code?: number })?.code
  return code === 429
}
