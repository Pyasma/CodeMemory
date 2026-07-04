"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card"

const QUICK_SYSTEM_MESSAGE =
  "You are CodeMemory's commit assistant. Return only the summary content. Use exactly 3 bullet points. Do not add an intro sentence, title, or closing line. Mention the likely impact and any obvious risk. Only use the provided repository context."

type RepoMainProps = {
  repo: {
    commits: {
      id: string
      sha: string
      message: string
      authorName: string | null
      committedAt: string | Date
      files: {
        id: string
        filePath: string
        additions: number
        deletions: number
        changes: number
        patch: string | null
      }[]
    }[]
  }
}

function getInitials(name: string | null) {
  if (!name) return "?"

  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function StreamingMarkdownSummary({ content }: { content: string }) {
  const [displayedContent, setDisplayedContent] = React.useState("")

  React.useEffect(() => {
    let cancelled = false
    let currentIndex = 0
    let frameId = 0

    const tick = () => {
      if (cancelled) {
        return
      }

      currentIndex = Math.min(content.length, currentIndex + 4)
      setDisplayedContent(content.slice(0, currentIndex))

      if (currentIndex < content.length) {
        frameId = window.setTimeout(tick, 12)
      }
    }

    frameId = window.setTimeout(tick, 0)

    return () => {
      cancelled = true
      window.clearTimeout(frameId)
    }
  }, [content])

  const isStreaming = displayedContent.length < content.length

  return (
    <div className="space-y-3">
      {isStreaming ? (
        <div className="whitespace-pre-wrap leading-6 text-zinc-700">
          {displayedContent}
          <span className="inline-block h-4 w-2 animate-pulse align-middle text-zinc-500">
            |
          </span>
        </div>
      ) : (
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p className="leading-6 text-zinc-700">{children}</p>
            ),
            ul: ({ children }) => <ul className="space-y-2 pl-5">{children}</ul>,
            ol: ({ children }) => <ol className="space-y-2 pl-5">{children}</ol>,
            li: ({ children }) => (
              <li className="list-disc leading-6 text-zinc-700">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-zinc-950">{children}</strong>
            ),
            code: ({ children, className }) => (
              <code
                className={`rounded bg-white px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-900 ring-1 ring-zinc-200 ${
                  className ?? ""
                }`}
              >
                {children}
              </code>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      )}
    </div>
  )
}

function SummaryLoadingState() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-3 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="h-2.5 w-24 animate-pulse rounded-full bg-zinc-200" />
        <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-zinc-100" />
        <div className="h-2.5 w-3/5 animate-pulse rounded-full bg-zinc-100" />
      </div>
    </div>
  )
}

function renderPatch(patch: string | null) {
  if (!patch) {
    return (
      <div className="text-sm text-muted-foreground">
        No diff available for this file.
      </div>
    )
  }

  const lines = patch.split("\n")

  return (
    <pre className="overflow-x-auto font-mono text-[12px] leading-5">
      {lines.map((line, index) => {
        const isAddition = line.startsWith("+") && !line.startsWith("+++")
        const isDeletion = line.startsWith("-") && !line.startsWith("---")
        const isHeader =
          line.startsWith("@@") ||
          line.startsWith("diff --git") ||
          line.startsWith("index ") ||
          line.startsWith("+++ ") ||
          line.startsWith("--- ")

        const rowClass = isAddition
          ? "bg-emerald-50 text-emerald-700"
          : isDeletion
            ? "bg-rose-50 text-rose-700"
            : isHeader
              ? "text-zinc-500"
              : "text-zinc-700"

        return (
          <div key={`${index}-${line}`} className={`px-3 ${rowClass}`}>
            {line || " "}
          </div>
        )
      })}
    </pre>
  )
}


export function RepoMain({ repo }: RepoMainProps) {
    const [openCommits, setOpenCommits] = React.useState<Record<string, boolean>>(
      {}
    )
    const [summaries, setSummaries] = React.useState<Record<string, string>>({})
    const [loadingCommitId, setLoadingCommitId] = React.useState<string | null>(
      null
    )
    const [summaryErrors, setSummaryErrors] = React.useState<
      Record<string, string>
    >({})

    async function handleSummariseCommit(
      commit: RepoMainProps["repo"]["commits"][number]
    ) {
      const payload = {
        commit: {
          id: commit.id,
          sha: commit.sha,
          message: commit.message,
          authorName: commit.authorName,
          committedAt: commit.committedAt,
        },
        files: commit.files.map((file) => ({
          filePath: file.filePath,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch:
            file.patch && file.patch.length > 1200
              ? `${file.patch.slice(0, 1200)}\n...[truncated]`
              : file.patch,
        })),
      }

      setLoadingCommitId(commit.id)
      setSummaryErrors((prev) => ({
        ...prev,
        [commit.id]: "",
      }))

      try {
        const response = await fetch("/api/ai/summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            info: JSON.stringify(payload, null, 2),
            systemMessage: QUICK_SYSTEM_MESSAGE,
          }),
        })

        const data = (await response.json()) as {
          success: boolean
          reply?: string
          message?: string
        }

        if (!response.ok || !data.success) {
          throw new Error(data.message ?? "Failed to generate summary")
        }

        const reply = data.reply

        if (!reply) {
          throw new Error("The model returned an empty summary")
        }

        setSummaries((prev) => ({
          ...prev,
          [commit.id]: reply,
        }))
      } catch (error) {
        setSummaryErrors((prev) => ({
          ...prev,
          [commit.id]:
            error instanceof Error
              ? error.message
              : "Failed to generate summary",
        }))
      } finally {
        setLoadingCommitId(null)
      }
    }

    return (
    <div className="w-full space-y-5">
        <div className="border-b border-zinc-200 pb-4">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-950">Commits</h2>
              <p className="mt-1 text-sm text-zinc-500">
                  {repo.commits.length} commits
              </p>
            </div>
        </div>

        <div className="space-y-3 pb-4">
            {repo.commits.map((commit) => (
                <div key={commit.id} className="relative pl-10">
                  <div className="absolute left-[17px] top-0 bottom-0 w-px bg-zinc-200" />
                  <div className="absolute left-0 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-700">
                      {getInitials(commit.authorName)}
                    </div>
                  </div>

                  <Card className="w-full max-w-full border-zinc-200 bg-white text-zinc-950 shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <CardTitle className="text-[15px] font-semibold text-zinc-950">
                                  {commit.message}
                              </CardTitle>
                              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-500">
                                {commit.sha.slice(0, 7)}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-500">
                                {commit.authorName ?? "Unknown author"} committed{" "}
                                {new Date(commit.committedAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                            </p>
                          </div>

                          <CardAction className="flex flex-col gap-5">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenCommits((prev) => ({
                                  ...prev,
                                  [commit.id]: !prev[commit.id],
                                }))
                              }
                              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
                              aria-expanded={Boolean(openCommits[commit.id])}
                            >
                              {openCommits[commit.id] ? "Hide diff" : "Show diff"}
                              <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform ${
                                  openCommits[commit.id] ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSummariseCommit(commit)}
                              disabled={loadingCommitId === commit.id}
                              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loadingCommitId === commit.id
                                  ? "Summarising..."
                                  : "Summarise"}
                            </button>
                          </CardAction>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-3 border-t border-zinc-200 pt-4">
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span>{commit.files.length} files changed</span>
                          <span>
                            +{commit.files.reduce((sum, file) => sum + file.additions, 0)}
                          </span>
                          <span>
                            -{commit.files.reduce((sum, file) => sum + file.deletions, 0)}
                          </span>
                        </div>

                        {summaryErrors[commit.id] ? (
                          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {summaryErrors[commit.id]}
                          </div>
                        ) : null}

                        {loadingCommitId === commit.id ? (
                          <SummaryLoadingState />
                        ) : summaries[commit.id] ? (
                          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 shadow-sm">
                            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
                              AI summary
                            </div>
                            <StreamingMarkdownSummary
                              key={`${commit.id}-${summaries[commit.id]}`}
                              content={summaries[commit.id]}
                            />
                          </div>
                        ) : null}

                        {openCommits[commit.id] && (
                          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-inner">
                            {commit.files.map((file) => (
                              <div key={file.id} className="border-b border-zinc-200 last:border-b-0">
                                <div className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-3 py-2">
                                  <div className="font-mono text-xs text-zinc-700">
                                    {file.filePath}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                                      +{file.additions}
                                    </span>
                                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">
                                      -{file.deletions}
                                    </span>
                                    <span className="rounded-full bg-zinc-100 px-2 py-0.5">
                                      {file.changes} changes
                                    </span>
                                  </div>
                                </div>

                                <div className="max-h-96 overflow-auto">
                                  {renderPatch(file.patch)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </CardContent>
                  </Card>
                </div>
            ))}
        </div>
    </div>
    )
}
