import "server-only"

import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { spawn } from "node:child_process"
import { resolve } from "node:path"

import { prisma } from "@/db/prisma"

type RepoForMemory = {
  id: string
  owner: string
  name: string
  githubUrl: string
  totalFiles: number
  totalCommits: number
  indexedAt: Date | null
  commits: Array<{
    id: string
    sha: string
    message: string
    authorName: string | null
    committedAt: Date
    files: Array<{
      id: string
      filePath: string
      status: string
      patch: string | null
      additions: number
      deletions: number
      changes: number
    }>
  }>
}

type RepoMemoryMatch = {
  sourceType: string
  sourceId: string
  title: string
  content: string
  similarity: number
  metadata: Record<string, unknown>
}

type RepoMemoryDocument = {
  sourceType: string
  sourceId: string
  title: string
  content: string
  metadata: Record<string, unknown>
}

type RepoMemoryStoredState = {
  datasetName: string | null
  syncSignature: string | null
  documentCount: number
  syncedAt: Date | null
}

type RepoMemorySnapshot = {
  repo: RepoForMemory
  documents: RepoMemoryDocument[]
  signature: string
}

type CogneeBridgeResponse<T> = {
  ok: boolean
  error?: string
  [key: string]: unknown
} & T

const MAX_TEXT_CHARS = 6000
const DEFAULT_COGNEE_SYNC_TABLE = "repo_memory_syncs"

function truncateText(text: string) {
  if (text.length <= MAX_TEXT_CHARS) {
    return text
  }

  return text.slice(0, MAX_TEXT_CHARS)
}

function sortCommits(repo: RepoForMemory["commits"]) {
  return [...repo].sort((left, right) => {
    const dateDelta = right.committedAt.getTime() - left.committedAt.getTime()

    if (dateDelta !== 0) {
      return dateDelta
    }

    return left.sha.localeCompare(right.sha)
  })
}

function sortFiles(commit: RepoForMemory["commits"][number]["files"]) {
  return [...commit].sort((left, right) => {
    const pathDelta = left.filePath.localeCompare(right.filePath)

    if (pathDelta !== 0) {
      return pathDelta
    }

    return left.status.localeCompare(right.status)
  })
}

function buildMemoryDocuments(repo: RepoForMemory) {
  const repoSummary = [
    `Repository: ${repo.owner}/${repo.name}`,
    `URL: ${repo.githubUrl}`,
    `Total files: ${repo.totalFiles}`,
    `Total commits: ${repo.totalCommits}`,
  ].join("\n")

  const documents: RepoMemoryDocument[] = [
    {
      sourceType: "repo",
      sourceId: repo.id,
      title: `${repo.owner}/${repo.name}`,
      content: repoSummary,
      metadata: {
        repoId: repo.id,
        owner: repo.owner,
        name: repo.name,
      },
    },
  ]

  for (const commit of sortCommits(repo.commits)) {
    const files = sortFiles(commit.files)
    const fileList = files.map((file) => `${file.status}: ${file.filePath}`).join("\n")
    const commitText = [
      `Commit: ${commit.sha}`,
      `Message: ${commit.message}`,
      `Author: ${commit.authorName ?? "Unknown"}`,
      `Date: ${commit.committedAt.toISOString()}`,
      fileList ? `Files:\n${fileList}` : "",
    ]
      .filter(Boolean)
      .join("\n")

    documents.push({
      sourceType: "commit",
      sourceId: commit.id,
      title: commit.sha.slice(0, 8),
      content: truncateText(commitText),
      metadata: {
        repoId: repo.id,
        commitId: commit.id,
        sha: commit.sha,
      },
    })

    for (const file of files) {
      const fileText = [
        `Commit: ${commit.sha}`,
        `File: ${file.filePath}`,
        `Status: ${file.status}`,
        `Diff stats: +${file.additions} -${file.deletions} (${file.changes} changes)`,
        file.patch ? `Patch:\n${file.patch}` : "",
      ]
        .filter(Boolean)
        .join("\n")

      documents.push({
        sourceType: "file",
        sourceId: file.id,
        title: file.filePath,
        content: truncateText(fileText),
        metadata: {
          repoId: repo.id,
          commitId: commit.id,
          fileId: file.id,
          filePath: file.filePath,
          sha: commit.sha,
        },
      })
    }
  }

  return documents
}

function buildMemorySignature(documents: RepoMemoryDocument[]) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        documents.map((document) => ({
          sourceType: document.sourceType,
          sourceId: document.sourceId,
          title: document.title,
          content: document.content,
          metadata: document.metadata,
        }))
      )
    )
    .digest("hex")
}

function buildRepoMemorySnapshot(repo: RepoForMemory): RepoMemorySnapshot {
  const documents = buildMemoryDocuments(repo)

  return {
    repo,
    documents,
    signature: buildMemorySignature(documents),
  }
}

async function loadRepoForMemory(repoId: string) {
  return (await prisma.repo.findFirst({
    where: { id: repoId },
    include: {
      commits: {
        orderBy: {
          committedAt: "desc",
        },
        include: {
          files: true,
        },
      },
    },
  })) as RepoForMemory | null
}

function getWorkspaceRoot() {
  const cwd = process.cwd()

  if (existsSync(resolve(cwd, "..", "cognee-setup", "main.py"))) {
    return resolve(cwd, "..", "cognee-setup")
  }

  if (existsSync(resolve(cwd, "apps", "cognee-setup", "main.py"))) {
    return resolve(cwd, "apps", "cognee-setup")
  }

  return resolve(cwd, "..", "cognee-setup")
}

function getCogneePythonBinary() {
  if (process.env.COGNEE_PYTHON_BIN) {
    return process.env.COGNEE_PYTHON_BIN
  }

  const workspaceRoot = getWorkspaceRoot()
  const candidate = resolve(workspaceRoot, ".venv", "bin", "python")

  if (existsSync(candidate)) {
    return candidate
  }

  return "python3"
}

function getCogneeScriptPath() {
  return resolve(getWorkspaceRoot(), "main.py")
}

function getCogneeEnv() {
  const geminiApiKey =
    process.env.COGNEE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY ?? ""

  return {
    ...process.env,
    ENABLE_BACKEND_ACCESS_CONTROL:
      process.env.COGNEE_ENABLE_BACKEND_ACCESS_CONTROL ?? "false",
    LLM_PROVIDER: process.env.COGNEE_LLM_PROVIDER ?? "gemini",
    LLM_MODEL:
      process.env.COGNEE_LLM_MODEL ??
      process.env.GEMINI_MODEL ??
      "gemini/gemini-3.1-flash-lite",
    LLM_API_KEY:
      process.env.COGNEE_LLM_API_KEY ??
      process.env.GEMINI_API_KEY ??
      geminiApiKey,
    EMBEDDING_PROVIDER: process.env.COGNEE_EMBEDDING_PROVIDER ?? "gemini",
    EMBEDDING_MODEL:
      process.env.COGNEE_EMBEDDING_MODEL ??
      process.env.GEMINI_EMBEDDING_MODEL ??
      "gemini/gemini-embedding-2",
    EMBEDDING_API_KEY:
      process.env.COGNEE_EMBEDDING_API_KEY ??
      process.env.GEMINI_API_KEY ??
      geminiApiKey,
  }
}

async function runCogneeBridge<T>(payload: Record<string, unknown>) {
  const pythonBinary = getCogneePythonBinary()
  const scriptPath = getCogneeScriptPath()
  const child = spawn(pythonBinary, [scriptPath], {
    env: getCogneeEnv(),
    stdio: ["pipe", "pipe", "pipe"],
  })

  let stdout = ""
  let stderr = ""

  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString()
  })

  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString()
  })

  child.stdin.end(`${JSON.stringify(payload)}\n`)

  const exitCode = await new Promise<number>((resolveExit, rejectExit) => {
    child.on("error", rejectExit)
    child.on("close", resolveExit)
  })

  const output = stdout.trim()

  if (exitCode !== 0) {
    throw new Error(
      stderr.trim() ||
        output ||
        `Cognee bridge failed with exit code ${exitCode}`
    )
  }

  if (!output) {
    throw new Error("Cognee bridge returned no output")
  }

  const parsed = JSON.parse(output) as CogneeBridgeResponse<T>

  if (!parsed.ok) {
    throw new Error(parsed.error ?? "Cognee bridge request failed")
  }

  return parsed
}

async function ensureRepoMemoryTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ${DEFAULT_COGNEE_SYNC_TABLE} (
      repo_id TEXT PRIMARY KEY REFERENCES "Repo"(id) ON DELETE CASCADE,
      dataset_name TEXT NOT NULL,
      sync_signature TEXT NOT NULL,
      document_count INT NOT NULL,
      synced_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS repo_memory_syncs_dataset_name_idx
      ON ${DEFAULT_COGNEE_SYNC_TABLE} (dataset_name)
  `)
}

async function getStoredRepoMemoryState(
  repoId: string
): Promise<RepoMemoryStoredState | null> {
  const row = await prisma.$queryRawUnsafe<
    Array<{
      dataset_name: string
      sync_signature: string
      document_count: number
      synced_at: Date
    }>
  >(
    `
      SELECT dataset_name, sync_signature, document_count, synced_at
      FROM ${DEFAULT_COGNEE_SYNC_TABLE}
      WHERE repo_id = $1
      LIMIT 1
    `,
    repoId
  )

  return row[0]
    ? {
        datasetName: row[0].dataset_name,
        syncSignature: row[0].sync_signature,
        documentCount: row[0].document_count,
        syncedAt: row[0].synced_at,
      }
    : null
}

async function upsertRepoMemoryState(snapshot: RepoMemorySnapshot) {
  const datasetName = getRepoDatasetName(snapshot.repo.id)

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO ${DEFAULT_COGNEE_SYNC_TABLE} (
        repo_id,
        dataset_name,
        sync_signature,
        document_count,
        synced_at
      ) VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (repo_id) DO UPDATE SET
        dataset_name = EXCLUDED.dataset_name,
        sync_signature = EXCLUDED.sync_signature,
        document_count = EXCLUDED.document_count,
        synced_at = EXCLUDED.synced_at
    `,
    snapshot.repo.id,
    datasetName,
    snapshot.signature,
    snapshot.documents.length
  )

  await prisma.repo.update({
    where: { id: snapshot.repo.id },
    data: {
      indexedAt: new Date(),
    },
  })
}

function getRepoDatasetName(repoId: string) {
  return `repo_${repoId}`
}

function buildCogneeDocuments(documents: RepoMemoryDocument[]) {
  return documents.map((document) => {
    const metadataText = Object.entries(document.metadata).length
      ? `\nMetadata:\n${JSON.stringify(document.metadata, null, 2)}`
      : ""

    return [
      `[${document.sourceType}] ${document.title}`,
      document.content,
      metadataText,
    ]
      .filter(Boolean)
      .join("\n")
  })
}

async function writeRepoMemorySnapshot(snapshot: RepoMemorySnapshot) {
  const datasetName = getRepoDatasetName(snapshot.repo.id)
  const documents = buildCogneeDocuments(snapshot.documents)

  await runCogneeBridge({
    action: "sync",
    repoId: snapshot.repo.id,
    datasetName,
    documents,
  })

  await upsertRepoMemoryState(snapshot)

  return {
    repoId: snapshot.repo.id,
    documentsIndexed: snapshot.documents.length,
  }
}

export async function syncRepoMemory(repoId: string) {
  await ensureRepoMemoryTable()

  const repo = await loadRepoForMemory(repoId)

  if (!repo) {
    throw new Error("Repo not found")
  }

  return writeRepoMemorySnapshot(buildRepoMemorySnapshot(repo))
}

export async function ensureRepoMemorySynced(repoId: string) {
  await ensureRepoMemoryTable()

  const repo = await loadRepoForMemory(repoId)

  if (!repo) {
    throw new Error("Repo not found")
  }

  const snapshot = buildRepoMemorySnapshot(repo)
  const storedState = await getStoredRepoMemoryState(repoId)
  const datasetName = getRepoDatasetName(repoId)

  if (
    storedState &&
    storedState.datasetName === datasetName &&
    storedState.documentCount === snapshot.documents.length &&
    storedState.syncSignature === snapshot.signature
  ) {
    return {
      repoId,
      documentsIndexed: snapshot.documents.length,
      synced: true,
      refreshed: false,
    }
  }

  const syncResult = await writeRepoMemorySnapshot(snapshot)

  return {
    ...syncResult,
    synced: true,
    refreshed: true,
  }
}

function normalizeCogneeHits(hits: unknown[]): RepoMemoryMatch[] {
  return hits.map((hit, index) => {
    if (!hit || typeof hit !== "object") {
      return {
        sourceType: "cognee",
        sourceId: `cognee-${index + 1}`,
        title: `Result ${index + 1}`,
        content: String(hit ?? ""),
        similarity: 1,
        metadata: {},
      }
    }

    const record = hit as Record<string, unknown>
    const content =
      typeof record.content === "string"
        ? record.content
        : typeof record.text === "string"
          ? record.text
          : typeof record.answer === "string"
            ? record.answer
            : typeof record.context === "string"
              ? record.context
              : JSON.stringify(record)

    const sourceType =
      typeof record.sourceType === "string"
        ? record.sourceType
        : typeof record.source_type === "string"
          ? record.source_type
          : typeof record.kind === "string"
            ? record.kind
            : typeof record.source === "string"
              ? record.source
              : "cognee"

    const sourceId =
      typeof record.sourceId === "string"
        ? record.sourceId
        : typeof record.source_id === "string"
          ? record.source_id
          : typeof record.id === "string"
            ? record.id
            : `cognee-${index + 1}`

    const title =
      typeof record.title === "string"
        ? record.title
        : typeof record.name === "string"
          ? record.name
          : typeof record.node_name === "string"
            ? record.node_name
            : `Result ${index + 1}`

    const similarityValue = record.similarity ?? record.score ?? record.relevance
    const similarity =
      typeof similarityValue === "number"
        ? similarityValue
        : typeof similarityValue === "string"
          ? Number(similarityValue) || 1
          : 1

    return {
      sourceType,
      sourceId,
      title,
      content,
      similarity,
      metadata: Object.fromEntries(
        Object.entries(record).filter(
          ([key]) =>
            ![
              "content",
              "text",
              "answer",
              "context",
              "sourceType",
              "source_type",
              "kind",
              "source",
              "sourceId",
              "source_id",
              "id",
              "title",
              "name",
              "node_name",
              "similarity",
              "score",
              "relevance",
            ].includes(key)
        )
      ),
    }
  })
}

export async function searchRepoMemory(repoId: string, query: string, limit = 5) {
  try {
    await ensureRepoMemorySynced(repoId)
  } catch (error) {
    console.warn(
      "[repo-memory] sync failed before recall:",
      error instanceof Error ? error.message : "Unknown error"
    )
    return []
  }

  try {
    const result = await runCogneeBridge<{
      hits?: unknown[]
    }>({
      action: "recall",
      repoId,
      datasetName: getRepoDatasetName(repoId),
      query,
      topK: limit,
    })

    return normalizeCogneeHits(result.hits ?? [])
  } catch (error) {
    console.warn(
      "[repo-memory] recall failed:",
      error instanceof Error ? error.message : "Unknown error"
    )
    return []
  }
}
