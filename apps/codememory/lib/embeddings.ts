import "server-only"

import { GoogleGenAI } from "@google/genai"

const DEFAULT_MODEL = "gemini-embedding-001"
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
  const model = process.env.GEMINI_EMBEDDING_MODEL ?? DEFAULT_MODEL
  const outputDimensionality = Number(
    process.env.GEMINI_EMBEDDING_DIMENSIONS ?? DEFAULT_DIMENSIONS
  )

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
}

export function toVectorLiteral(values: number[]) {
  return `[${values.map((value) => Number(value).toString()).join(",")}]`
}

