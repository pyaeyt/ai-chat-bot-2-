import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

const SYSTEM_INSTRUCTION = `You are an educational assistant for a school/university platform. Your job is to answer students' questions ONLY based on the subject information provided to you by teachers.

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

export async function generateAIResponse(
  subjectContext: string,
  conversationHistory: Array<{ role: 'user' | 'model'; content: string }>,
  userMessage: string
): Promise<{ text: string; needsTeacher: boolean }> {
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

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    config: {
      systemInstruction: `${SYSTEM_INSTRUCTION}\n\n--- SUBJECT INFORMATION ---\n${subjectContext}\n--- END SUBJECT INFORMATION ---`,
    },
    contents,
  })

  const text = response.text ?? ''
  const needsTeacher = text.trim().startsWith('[NO_DATA]')
  const cleanText = needsTeacher
    ? text.replace(/^\[NO_DATA\]\s*/, '').trim()
    : text

  return { text: cleanText, needsTeacher }
}
