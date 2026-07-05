"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { toast } from "sonner"

export function QuickAddRepo() {
  const [url, setUrl] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const hasGreeted = sessionStorage.getItem("hasGreeted")
      if (!hasGreeted) {
        toast.success("Welcome back! Ready to chat with your repos?")
        sessionStorage.setItem("hasGreeted", "true")
      }
    }
  }, [])

  async function handleAdd() {
    const repoUrl = url.trim()
    if (!repoUrl) return

    setIsSubmitting(true)
    setError(null)

    const syncPromise = fetch("/api/fetching-repo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: repoUrl }),
    }).then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.message ?? "Failed to add repository")
      }
      return response
    })

    toast.promise(syncPromise, {
      loading: "Adding and indexing repository with Cognee (this may take a minute)...",
      success: "Repository synced successfully!",
      error: (err) => err instanceof Error ? err.message : "Failed to add repository"
    })

    try {
      await syncPromise
      setUrl("")
      router.refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to add repository"
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/65 p-1.5 pl-4 pr-1.5 shadow-inner focus-within:border-zinc-700 transition-colors">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleAdd()
          }}
          disabled={isSubmitting}
          placeholder="Paste GitHub repository URL..."
          className="flex-1 min-w-0 bg-transparent border-0 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-0"
        />

        <button
          onClick={() => void handleAdd()}
          disabled={isSubmitting || !url.trim()}
          className="flex h-9 px-4 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white text-zinc-950 font-medium text-xs hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          ) : (
            <>
              Sync
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

    </div>
  )
}
