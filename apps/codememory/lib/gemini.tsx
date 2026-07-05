import "server-only"

import { GoogleGenAI } from "@google/genai"

const DEFAULT_SYSTEM_MESSAGE =
  "You are CodeMemory's commit assistant. Use only the provided context, stay concise, and avoid inventing details."
const DEFAULT_MODELS = ["gemini-3.1-flash-lite", "gemini-2.5-flash"]

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
  const configuredModels = [
    process.env.GEMINI_MODEL,
    ...DEFAULT_MODELS,
  ].filter((model): model is string => Boolean(model))

  let lastError: unknown

  for (const model of configuredModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: info,
        config: {
          systemInstruction: systemMessage,
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      })

      return response.text?.trim() ?? ""
    } catch (error) {
      lastError = error
      console.warn("[gemini] generateContent failed for model:", model, error)
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All Gemini generation models failed")
}

export { DEFAULT_SYSTEM_MESSAGE }
