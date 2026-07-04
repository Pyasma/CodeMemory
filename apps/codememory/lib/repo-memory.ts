import "server-only"

import { randomUUID } from "node:crypto"

import { prisma } from "@/db/prisma"
import { vectorPool } from "@/lib/db-vector"
import { embedText, toVectorLiteral } from "@/lib/embeddings"

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

const MAX_TEXT_CHARS = 6000

function truncateText(text: string) {
  if (text.length <= MAX_TEXT_CHARS) {
    return text
  }

  return `${text.slice(0, MAX_TEXT_CHARS)}`
}

function buildMemoryDocuments(repo: RepoForMemory) {
  const repoSummary = [
    `Repository: ${repo.owner}/${repo.name}`,
    `URL: ${repo.githubUrl}`,
    `Total files: ${repo.totalFiles}`,
    `Total commits: ${repo.totalCommits}`,
  ].join("\n")

  const documents: Array<{
    sourceType: string
    sourceId: string
    title: string
    content: string
    metadata: Record<string, unknown>
  }> = [
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

  for (const commit of repo.commits) {
    const fileList = commit.files.map((file) => `${file.status}: ${file.filePath}`).join("\n")
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

    for (const file of commit.files) {
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

async function ensureRepoMemoryTable() {
  await vectorPool.query(`
    CREATE EXTENSION IF NOT EXISTS vector;

    CREATE TABLE IF NOT EXISTS repo_embeddings (
      id TEXT PRIMARY KEY,
      repo_id TEXT NOT NULL REFERENCES "Repo"(id) ON DELETE CASCADE,
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      embedding vector(768) NOT NULL,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS repo_embeddings_repo_id_idx
      ON repo_embeddings (repo_id);

    CREATE INDEX IF NOT EXISTS repo_embeddings_embedding_idx
      ON repo_embeddings
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
  `)
}

export async function syncRepoMemory(repoId: string) {
  await ensureRepoMemoryTable()

  const repo = (await prisma.repo.findFirst({
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

  if (!repo) {
    throw new Error("Repo not found")
  }

  const documents = buildMemoryDocuments(repo)

  await vectorPool.query(`DELETE FROM repo_embeddings WHERE repo_id = $1`, [repoId])

  for (const document of documents) {
    const embedding = await embedText({
      text: document.content,
      isQuery: false,
    })

    await vectorPool.query(
      `
        INSERT INTO repo_embeddings (
          id,
          repo_id,
          source_type,
          source_id,
          title,
          content,
          metadata,
          embedding,
          created_at,
          updated_at
        ) VALUES (
          $8,
          $1,
          $2,
          $3,
          $4,
          $5,
          $6::jsonb,
          $7::vector,
          NOW(),
          NOW()
        )
      `,
      [
        repoId,
        document.sourceType,
        document.sourceId,
        document.title,
        document.content,
        JSON.stringify(document.metadata),
        toVectorLiteral(embedding),
        randomUUID(),
      ]
    )
  }

  await prisma.repo.update({
    where: { id: repoId },
    data: {
      indexedAt: new Date(),
    },
  })

  return {
    repoId,
    documentsIndexed: documents.length,
  }
}

export async function searchRepoMemory(repoId: string, query: string, limit = 5) {
  await ensureRepoMemoryTable()

  const embedding = await embedText({
    text: query,
    isQuery: true,
  })

  const { rows } = await vectorPool.query<RepoMemoryMatch>(
    `
      SELECT
        source_type AS "sourceType",
        source_id AS "sourceId",
        title,
        content,
        metadata,
        1 - (embedding <=> $2::vector) AS similarity
      FROM repo_embeddings
      WHERE repo_id = $1
      ORDER BY embedding <=> $2::vector
      LIMIT $3
    `,
    [repoId, toVectorLiteral(embedding), limit]
  )

  return rows
}
