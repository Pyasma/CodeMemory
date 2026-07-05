"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Disc, MessagesSquare, RefreshCw, Sparkles } from "lucide-react"

type Project = {
  id: string
  name: string
  githubUrl: string
}

export function BuyCDContent({ projects = [] }: { projects: Project[] }) {
  const [selectedRepoId, setSelectedRepoId] = React.useState(projects[0]?.id ?? "")

  React.useEffect(() => {
    if (projects.length > 0 && !selectedRepoId) {
      setSelectedRepoId(projects[0].id)
    }
  }, [projects, selectedRepoId])

  const selectedRepo =
    projects.find((project) => project.id === selectedRepoId) ?? projects[0] ?? null

  return (
    <div className="relative flex h-full w-full flex-col overflow-y-auto rounded-[2rem] border border-zinc-800/80 bg-zinc-900/40 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-md sm:p-10">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#BC9BFF]/6 blur-[120px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.03] to-transparent" />

      <div className="relative z-10 grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#BC9BFF]/30 bg-[#BC9BFF]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-[#BC9BFF]">
              <Disc className="h-3.5 w-3.5" style={{ animation: "spin 6s linear infinite" }} />
              CD mode
            </div>

            <h1 className="max-w-xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              You can chat with your repo inside of CD too.
            </h1>

            <p className="max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
              CodeMemory turns each repository into a portable disc archive.
              Pick a repo, sync the latest commits from main, and ask questions
              directly against its history, diffs, and chat memory.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                01
              </div>
              <div className="mt-2 text-sm font-semibold text-white">Select a repo</div>
              <p className="mt-1 text-xs leading-5 text-zinc-450">
                Choose the project you want to keep on disc.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                02
              </div>
              <div className="mt-2 text-sm font-semibold text-white">Open chat</div>
              <p className="mt-1 text-xs leading-5 text-zinc-450">
                Ask about commits, files, and recent changes.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                03
              </div>
              <div className="mt-2 text-sm font-semibold text-white">Keep it synced</div>
              <p className="mt-1 text-xs leading-5 text-zinc-450">
                Pull new commits whenever main moves forward.
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/50 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                  Repository
                </div>
                <label className="mt-2 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Select Repository
                </label>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#BC9BFF]/20 bg-[#BC9BFF]/10 text-[#BC9BFF]">
                <MessagesSquare className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <select
                value={selectedRepoId}
                onChange={(e) => setSelectedRepoId(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 outline-none transition-colors focus:border-[#BC9BFF]/60"
              >
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.githubUrl})
                    </option>
                  ))
                ) : (
                  <option value="">No projects available</option>
                )}
              </select>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-850 bg-zinc-900/50 p-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                    Chat-ready
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">Repo memory</div>
                </div>
                <div className="rounded-xl border border-zinc-850 bg-zinc-900/50 p-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                    Live
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">Commit sync</div>
                </div>
                <div className="rounded-xl border border-zinc-850 bg-zinc-900/50 p-3">
                  <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                    Portable
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">CD archive</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={selectedRepo ? `/repo/${selectedRepo.id}` : "#"}
                  aria-disabled={!selectedRepo}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all ${
                    selectedRepo
                      ? "bg-white text-zinc-950 hover:bg-zinc-200"
                      : "cursor-not-allowed bg-zinc-800 text-zinc-500"
                  }`}
                >
                  Open repo workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-xs font-medium text-zinc-400">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Sync latest commits from main before chatting
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950/60 shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                  Disc preview
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {selectedRepo ? selectedRepo.name : "No repository selected"}
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#BC9BFF]/20 bg-[#BC9BFF]/10 text-[#BC9BFF]">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                  Example prompt
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-200">
                  What changed in the latest commits on main?
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="text-xs font-semibold text-white">
                    CodeMemory Assistant
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    I can read the repo archive on disc, sync the newest commits,
                    and explain the diffs in plain language.
                  </p>
                </div>

                <div className="ml-10 rounded-2xl border border-[#BC9BFF]/20 bg-[#BC9BFF]/10 p-4">
                  <div className="text-xs font-semibold text-[#E8D8FF]">You</div>
                  <p className="mt-2 text-sm leading-6 text-zinc-200">
                    Show me the risky parts before I ship it.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="text-xs font-semibold text-white">
                    CodeMemory Assistant
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    I will surface commit summaries, file diffs, and the relevant
                    memory hits so you can review the repo like a disc-sized
                    workspace.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                Why CD
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Because your repo should feel archived, searchable, and still
                chat-ready.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                CodeMemory
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Your repository stays readable, queryable, and synced even when
                it lives in disc mode.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
