"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Bot, Sparkles, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

type ChatMessage = {
  id: string
  role: string
  content: string
  createdAt: string
}

type MemoryHit = {
  sourceType: string
  sourceId: string
  title: string
  content: string
  similarity: number
}

type ChatPageProps = {
  chat: {
    id: string
    title: string | null
    repo: {
      id: string
      owner: string
      name: string
      githubUrl: string
      totalFiles: number
      totalCommits: number
      indexedAt: string | Date | null
    }
    messages: ChatMessage[]
  }
  embedded?: boolean
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function MessageBubble({
  role,
  content,
  createdAt,
}: {
  role: string
  content: string
  createdAt: string
}) {
  const isAssistant = role === "assistant"

  return (
    <div className={`flex gap-3 ${isAssistant ? "" : "justify-end"}`}>
      {isAssistant && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted text-foreground">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={`max-w-[min(46rem,85%)] rounded-3xl border px-4 py-3 shadow-sm ${
          isAssistant
            ? "border-border bg-card text-foreground"
            : "border-foreground/10 bg-foreground text-background"
        }`}
      >
        <div className="whitespace-pre-wrap text-sm leading-6">{content}</div>
        <div
          className={`mt-2 text-[11px] uppercase tracking-[0.18em] ${
            isAssistant ? "text-muted-foreground" : "text-background/65"
          }`}
        >
          {formatDate(createdAt)}
        </div>
      </div>

      {!isAssistant && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-foreground/10 bg-background text-foreground">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}

export function ChatPageView({ chat, embedded = false }: ChatPageProps) {
  const router = useRouter()
  const [messages, setMessages] = React.useState(chat.messages)
  const [draft, setDraft] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const [memoryHits, setMemoryHits] = React.useState<MemoryHit[]>([])
  const bottomRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, memoryHits])

  async function handleSend() {
    const text = draft.trim()
    if (!text || isSending) {
      return
    }

    setIsSending(true)
    setDraft("")

    const optimisticUser = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticUser])

    try {
      const response = await fetch(`/api/chats/${chat.id}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      })

      const data = (await response.json()) as {
        success: boolean
        reply?: string
        message?: string
        memoryHits?: MemoryHit[]
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message ?? "Failed to send message")
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `temp-assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply ?? "No response returned.",
          createdAt: new Date().toISOString(),
        },
      ])

      setMemoryHits(data.memoryHits ?? [])
      router.refresh()
    } catch {
      setMessages((prev) => prev.slice(0, -1))
      setDraft(text)
    } finally {
      setIsSending(false)
    }
  }

  const shellClass = embedded
    ? "relative flex h-full min-h-0 overflow-hidden rounded-[2rem] border border-border/70 bg-background/85 shadow-[0_20px_60px_rgba(0,0,0,0.06)] backdrop-blur text-foreground"
    : "relative min-h-[calc(100vh-72px)] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(0,0,0,0.08),_transparent_32%),linear-gradient(180deg,#f7f5f1_0%,#f3eee7_100%)] text-foreground"

  return (
    <div className={shellClass}>
      {!embedded && (
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(rgba(17,17,17,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.04)_1px,transparent_1px)] bg-[size:30px_30px]" />
        </div>
      )}

      <main
        className={
          embedded
            ? "flex h-full min-h-0 w-full flex-col overflow-hidden"
            : "relative mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px] lg:px-8"
        }
      >
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {!embedded && (
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  Repo chat
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                  {chat.title ?? `${chat.repo.owner}/${chat.repo.name}`}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ask about commits, files, diffs, or repo history.
                </p>
              </div>

              <a
                href={chat.repo.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
              >
                Open GitHub
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[320px] items-center justify-center">
                <Card className="max-w-lg border-dashed bg-muted/40">
                  <CardHeader>
                    <CardTitle>Start the conversation</CardTitle>
                    <CardDescription>
                      Ask what changed, how a feature works, or where a bug was introduced.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    The assistant will pull semantic matches from repo memory and answer in context.
                  </CardContent>
                </Card>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  createdAt={message.createdAt}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <Separator />

          <div className="p-4">
            <Card className="border-border/70 bg-background">
              <CardContent className="p-4">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      void handleSend()
                    }
                  }}
                  placeholder="Ask about this repo..."
                  className="min-h-28 resize-none border-border bg-muted/30 text-sm"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Shift+Enter for a new line.
                  </p>
                  <Button onClick={() => void handleSend()} disabled={isSending || !draft.trim()}>
                    {isSending ? "Thinking..." : "Send"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {!embedded && (
          <aside className="flex flex-col gap-4">
            <Card className="border-border/70 bg-background/85 backdrop-blur">
              <CardHeader>
                <CardTitle>Repository</CardTitle>
                <CardDescription>
                  Memory is synced from this repo and used for recall.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Repo</span>
                  <span className="font-medium text-foreground">
                    {chat.repo.owner}/{chat.repo.name}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Commits</span>
                  <span className="font-medium text-foreground">{chat.repo.totalCommits}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Files</span>
                  <span className="font-medium text-foreground">{chat.repo.totalFiles}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Memory</span>
                  <span className="font-medium text-foreground">
                    {chat.repo.indexedAt ? "Indexed" : "Not indexed"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-background/85 backdrop-blur">
              <CardHeader>
                <CardTitle>Latest memory hits</CardTitle>
                <CardDescription>
                  Matches from the last assistant lookup.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {memoryHits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Ask a question to see relevant repo memory here.
                  </p>
                ) : (
                  memoryHits.map((hit) => (
                    <div key={`${hit.sourceType}-${hit.sourceId}`} className="rounded-2xl border border-border bg-muted/40 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {hit.sourceType}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(hit.similarity * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="mt-1 text-sm font-medium text-foreground">
                        {hit.title}
                      </div>
                      <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {hit.content}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </aside>
        )}
      </main>
    </div>
  )
}
