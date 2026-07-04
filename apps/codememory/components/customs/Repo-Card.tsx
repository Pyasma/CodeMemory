"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { 
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardAction,
} from "@/components/ui/card"

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

    return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
        <div className="border-b border-zinc-200 pb-4">
            <h2 className="text-2xl font-semibold text-zinc-950">Commits</h2>
            <p className="mt-1 text-sm text-zinc-500">
                {repo.commits.length} commits
            </p>
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

                          <CardAction>
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
