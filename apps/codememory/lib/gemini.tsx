import "server-only"

import { GoogleGenAI } from "@google/genai"

const DEFAULT_SYSTEM_MESSAGE =
  "You are CodeMemory's commit assistant. Use only the provided context, stay concise, and avoid inventing details."

type GeminiReplyInput = {
  info: string
  systemMessage?: string
}

export async function generateGeminiReply({
  info,
  systemMessage = DEFAULT_SYSTEM_MESSAGE,
}: GeminiReplyInput) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: info,
    config: {
      systemInstruction: systemMessage,
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
  })

  return response.text?.trim() ?? ""
}

export { DEFAULT_SYSTEM_MESSAGE }
