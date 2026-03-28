import { GoogleGenAI } from '@google/genai'
import { isGeminiRateLimitError, shuffledGeminiKeys } from '@/lib/geminiKeys'

const SYSTEM_INSTRUCTION = `You are an educational assistant for a school/university platform. Your job is to answer students' questions ONLY based on the subject information provided to you by teachers.

MULTILINGUAL SUPPORT (required):
- Students may write in any language (e.g. English, Spanish, French, German, Chinese, Japanese, Korean, Thai, Burmese, Arabic, Hindi, Portuguese, Italian, Vietnamese, Indonesian, and others).
- Always reply in the SAME language as the student's current message. If they mix languages, use the main language of that message.
- If earlier turns were in another language but the latest message is clearly in one language, follow the latest message's language.
- The "SUBJECT INFORMATION" block below may be in any language; use it as the only source of facts. You may explain or paraphrase that content in the student's language without adding new facts.
- When you must use [NO_DATA], put the tag on its own line first (the tag stays exactly [NO_DATA]), then write the explanation entirely in the student's language.

RULES:
1. Only answer based on the provided subject information context below.
2. If the provided information does not contain sufficient data to answer the student's question, you MUST begin your response with exactly [NO_DATA] on its own line, followed by a polite explanation that you don't have this specific information and suggesting they contact the teacher directly.
3. Be helpful, friendly, and educational in tone.
4. Format responses clearly with markdown when helpful.
5. If you can partially answer from the data, do so and mention what additional info might be needed.
6. Do NOT make up or guess information that isn't in the provided context.

Examples of when to use [NO_DATA]:
- The student asks about something not covered in the subject info
- The student asks about another subject entirely
- The information needed simply isn't available in the context`

/** Prefer newer models first; 2.0-flash often hits free-tier quota 0 while 2.5-flash still works. */
const DEFAULT_MODEL_FALLBACKS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]

function geminiModelCandidates(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim()
  const extras = process.env.GEMINI_MODEL_FALLBACKS?.split(/[\s,]+/).map((m) => m.trim()).filter(Boolean) ?? []
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of [primary, ...extras, ...DEFAULT_MODEL_FALLBACKS].filter(Boolean) as string[]) {
    if (!seen.has(m)) {
      seen.add(m)
      out.push(m)
    }
  }
  return out
}

function shouldTryNextModel(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
  return (
    msg.includes('not found') ||
    msg.includes('not supported') ||
    msg.includes('invalid') && msg.includes('model') ||
    msg.includes('404')
  )
}

export async function generateAIResponse(
  subjectContext: string,
  conversationHistory: Array<{ role: 'user' | 'model'; content: string }>,
  userMessage: string
): Promise<{ text: string; needsTeacher: boolean }> {
  const keys = shuffledGeminiKeys()
  if (keys.length === 0) {
    throw new Error(
      'No Gemini API keys configured. Set GEMINI_API_KEYS1, GEMINI_API_KEYS2, … or GEMINI_API_KEY in .env.local.'
    )
  }

  const contents = [
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'model',
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user' as const,
      parts: [{ text: userMessage }],
    },
  ]

  const models = geminiModelCandidates()
  let lastError: unknown

  for (const model of models) {
    for (const apiKey of keys) {
      const ai = new GoogleGenAI({ apiKey })
      const config = {
        systemInstruction: `${SYSTEM_INSTRUCTION}\n\n--- SUBJECT INFORMATION ---\n${subjectContext}\n--- END SUBJECT INFORMATION ---`,
      }
      try {
        const response = await ai.models.generateContent({
          model,
          config,
          contents,
        })

        const text = response.text ?? ''
        const needsTeacher = text.trim().startsWith('[NO_DATA]')
        const cleanText = needsTeacher ? text.replace(/^\[NO_DATA\]\s*/, '').trim() : text

        return { text: cleanText, needsTeacher }
      } catch (err) {
        lastError = err
        if (isGeminiRateLimitError(err)) {
          continue
        }
        if (shouldTryNextModel(err)) {
          break
        }
        throw err
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('All Gemini models/keys failed (e.g. rate limited or invalid keys).')
}
