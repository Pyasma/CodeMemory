"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { PencilEdit02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export function AddRepoDialog() {
  const [open, setOpen] = React.useState(false)
  const [url, setUrl] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const router = useRouter()

  async function handleAdd() {
    const repoUrl = url.trim()
    if (!repoUrl) return

    setIsSubmitting(true)

    const syncPromise = fetch("/api/fetching-repo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: repoUrl }),
    }).then(async (response) => {
      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.message ?? "Failed to add repository")
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
      setOpen(false)
      router.refresh()
    } catch (error) {
      // Handled by toast.promise
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={false}
        render={<SidebarMenuButton render={<div />} />}
      >
        <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
        <span>Add Repo</span>
      </DialogTrigger>
      <DialogContent className="border-zinc-800 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Add Repo</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input
            placeholder="GitHub repo URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd()
            }}
            className="border-zinc-800 bg-zinc-900/50 text-white placeholder-zinc-500"
          />
          <Button onClick={handleAdd} disabled={isSubmitting} className="bg-white text-zinc-950 hover:bg-zinc-200 cursor-pointer">
            {isSubmitting ? "Adding..." : "Add Repo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
