import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/db/prisma"
import { generateGeminiReply } from "@/lib/gemini"
import { searchRepoMemory } from "@/lib/repo-memory"

type ChatMessageBody = {
  message?: string
}

type ChatMessageRecord = {
  id: string
  role: string
  content: string
  createdAt: Date
}

const CHAT_SYSTEM_MESSAGE =
  "You are CodeMemory's repo chat assistant. Answer using the provided repo snapshot, recent conversation, and memory hits. Be concise and specific. If the exact detail is missing, give the best supported explanation from the available repo evidence instead of refusing."

const MEMORY_SEARCH_TIMEOUT_MS = 8_000
const REPLY_GENERATION_TIMEOUT_MS = 20_000

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
) {
  let timeoutId: NodeJS.Timeout | undefined

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(label))
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

function buildRepoSnapshotContext(repo: {
  owner: string
  name: string
  githubUrl: string
  totalFiles: number
  totalCommits: number
  commits: Array<{
    sha: string
    message: string
    committedAt: Date
    files: Array<{
      filePath: string
      status: string
    }>
  }>
}) {
  const recentCommits = repo.commits.slice(0, 6)

  const commitLines = recentCommits.flatMap((commit, index) => {
    const filePaths = commit.files.slice(0, 8).map((file) => `${file.status}: ${file.filePath}`)

    return [
      `${index + 1}. ${commit.sha.slice(0, 8)} - ${commit.message}`,
      `   Date: ${commit.committedAt.toISOString()}`,
      ...(filePaths.length ? [`   Files: ${filePaths.join(", ")}`] : []),
    ]
  })

  return [
    `Repository snapshot: ${repo.owner}/${repo.name}`,
    `GitHub URL: ${repo.githubUrl}`,
    `Total files: ${repo.totalFiles}`,
    `Total commits: ${repo.totalCommits}`,
    recentCommits.length ? "Recent commits:" : "Recent commits: none",
    ...commitLines,
  ].join("\n")
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_./-]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
}

function scoreText(queryTokens: string[], text: string) {
  const normalized = text.toLowerCase()

  return queryTokens.reduce((score, token) => {
    return normalized.includes(token) ? score + 1 : score
  }, 0)
}

function truncateForContext(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength)}...`
}

function buildRepoEvidenceContext(
  query: string,
  repo: {
    commits: Array<{
      sha: string
      message: string
      committedAt: Date
      files: Array<{
        filePath: string
        status: string
        patch: string | null
        additions: number
        deletions: number
        changes: number
      }>
    }>
  }
) {
  const queryTokens = tokenize(query)

  const scoredCommits = repo.commits
    .map((commit) => {
      const commitScore = scoreText(queryTokens, `${commit.sha} ${commit.message}`)
      const fileScore = commit.files.reduce((total, file) => {
        return (
          total +
          scoreText(
            queryTokens,
            `${file.filePath} ${file.status} ${file.additions} ${file.deletions} ${file.changes} ${file.patch ?? ""}`
          )
        )
      }, 0)

      return {
        commit,
        score: commitScore + fileScore,
      }
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return right.commit.committedAt.getTime() - left.commit.committedAt.getTime()
    })
    .slice(0, 3)

  if (scoredCommits.length === 0) {
    return "Repo evidence: no direct textual match found in recent commit messages or file diffs."
  }

  return [
    "Repo evidence:",
    ...scoredCommits.flatMap(({ commit }, commitIndex) => {
      const relevantFiles = commit.files
        .map((file) => {
          const score = scoreText(
            queryTokens,
            `${file.filePath} ${file.status} ${file.patch ?? ""}`
          )

          return {
            file,
            score,
          }
        })
        .filter((entry) => entry.score > 0)
        .sort((left, right) => {
          if (right.score !== left.score) {
            return right.score - left.score
          }

          return left.file.filePath.localeCompare(right.file.filePath)
        })
        .slice(0, 2)

      return [
        `${commitIndex + 1}. Commit ${commit.sha} - ${commit.message}`,
        `   Date: ${commit.committedAt.toISOString()}`,
        ...relevantFiles.flatMap(({ file }, fileIndex) => {
          const patchPreview = file.patch ? truncateForContext(file.patch, 1200) : ""

          return [
            `   File ${fileIndex + 1}: ${file.filePath} (${file.status})`,
            `   Diff stats: +${file.additions} -${file.deletions} (${file.changes} changes)`,
            ...(patchPreview ? [`   Patch preview:\n${patchPreview}`] : []),
          ]
        }),
      ]
    }),
  ].join("\n")
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User isn't authenticated" },
        { status: 401 }
      )
    }

    const { chatId } = await params
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        repo: {
          user: {
            clerkId: userId,
          },
        },
      },
      include: {
        repo: {
          include: {
            commits: {
              orderBy: {
                committedAt: "desc",
              },
              take: 6,
              include: {
                files: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          take: 12,
        },
      },
    })

    if (!chat || !chat.repo) {
      return NextResponse.json(
        { success: false, message: "Chat not found" },
        { status: 404 }
      )
    }

    const body = (await req.json()) as ChatMessageBody
    const message = body.message?.trim()

    if (!message) {
      return NextResponse.json(
        { success: false, message: "message is required" },
        { status: 400 }
      )
    }

    let memoryHits: Awaited<ReturnType<typeof searchRepoMemory>> = []

    try {
      memoryHits = await withTimeout(
        searchRepoMemory(chat.repoId, message, 5),
        MEMORY_SEARCH_TIMEOUT_MS,
        "Memory search timed out"
      )
    } catch (error) {
      console.warn(
        "[chat-message] memory search failed:",
        error instanceof Error ? error.message : "Unknown error"
      )
    }

    const context = [
      buildRepoSnapshotContext(chat.repo),
      "",
      buildRepoEvidenceContext(message, chat.repo),
      "",
      "Recent conversation:",
      ...chat.messages.map((entry) => `${entry.role.toUpperCase()}: ${entry.content}`),
      "",
      "Relevant memory hits:",
      ...memoryHits.map(
        (hit, index) =>
          `${index + 1}. [${hit.sourceType}] ${hit.title}\n${hit.content}`
      ),
      "",
      `User question: ${message}`,
    ].join("\n")

    const fallbackReply =
      "I'm having trouble generating a full answer right now. The message was saved, but the assistant response is temporarily unavailable."

    let reply = fallbackReply

    try {
      reply = await withTimeout(
        generateGeminiReply({
          info: context,
          systemMessage: CHAT_SYSTEM_MESSAGE,
        }),
        REPLY_GENERATION_TIMEOUT_MS,
        "Reply generation timed out"
      )
    } catch (error) {
      console.warn(
        "[chat-message] reply generation failed:",
        error instanceof Error ? error.message : "Unknown error"
      )
    }

    let createdMessages: ChatMessageRecord[] = []

    await prisma.$transaction(async (tx) => {
      const userMessage = await tx.message.create({
        data: {
          chatId: chat.id,
          role: "user",
          content: message,
        },
      })

      const assistantMessage = await tx.message.create({
        data: {
          chatId: chat.id,
          role: "assistant",
          content: reply || "I could not generate a response.",
        },
      })

      if (!chat.title) {
        await tx.chat.update({
          where: { id: chat.id },
          data: {
            title:
              message.length > 60
                ? `${message.slice(0, 57)}...`
                : message,
          },
        })
      } else {
        await tx.chat.update({
          where: { id: chat.id },
          data: {
            updatedAt: new Date(),
          },
        })
      }

      createdMessages = [userMessage, assistantMessage]
    })

    return NextResponse.json(
      {
        success: true,
        reply,
        memoryHits,
        messages: createdMessages,
      },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send chat message"

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}
