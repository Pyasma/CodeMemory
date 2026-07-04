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

export function AddRepoDialog() {
  const [open, setOpen] = React.useState(false)
  const [url, setUrl] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const router = useRouter()

  async function handleAdd() {
    const repoUrl = url.trim()
    if (!repoUrl) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/fetching-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: repoUrl }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.message ?? "Failed to add repository")
      }

      setUrl("")
      setOpen(false)
      router.refresh()
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Repo</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input
            placeholder="GitHub repo URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd()
            }}
          />
          <Button onClick={handleAdd} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Repo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
