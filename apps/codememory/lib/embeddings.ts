import "server-only"

import { GoogleGenAI } from "@google/genai"

const DEFAULT_MODELS = ["gemini-embedding-2", "gemini-embedding-001"]
const DEFAULT_DIMENSIONS = 768

type EmbedTextInput = {
  text: string
  isQuery?: boolean
}

function normalize(values: number[]) {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0))

  if (!magnitude) {
    return values
  }

  return values.map((value) => value / magnitude)
}

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  return new GoogleGenAI({ apiKey })
}

export async function embedText({ text, isQuery = false }: EmbedTextInput) {
  const client = getClient()
  const models = [
    process.env.GEMINI_EMBEDDING_MODEL,
    ...DEFAULT_MODELS,
  ].filter((value): value is string => Boolean(value))
  const outputDimensionality = Number(
    process.env.GEMINI_EMBEDDING_DIMENSIONS ?? DEFAULT_DIMENSIONS
  )

  let lastError: unknown

  for (const model of models) {
    try {
      const result = await client.models.embedContent({
        model,
        contents: text,
        config: {
          taskType: isQuery ? "CODE_RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT",
          outputDimensionality,
        },
      })

      const embedding = result.embeddings?.[0]?.values

      if (!embedding?.length) {
        throw new Error("Gemini embedding request returned no vector")
      }

      return normalize(embedding)
    } catch (error) {
      lastError = error
      console.warn("[gemini] embedContent failed for model:", model, error)
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All Gemini embedding models failed")
}

export function toVectorLiteral(values: number[]) {
  return `[${values.map((value) => Number(value).toString()).join(",")}]`
}
