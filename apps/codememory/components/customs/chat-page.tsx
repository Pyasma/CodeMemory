"use client"

import * as React from "react"
import { ArrowUpRight, Bot, Sparkles, User, Plus, Smile, SendHorizontal } from "lucide-react"
import ReactMarkdown from "react-markdown"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

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
  initialQuery?: string
  onMessagesPersisted?: (messages: ChatMessage[]) => void
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
    <div className="flex items-start gap-4 py-4 px-2 border-b border-white/[0.02]">
      {/* Avatar Circle */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 text-white shadow-sm">
        {isAssistant ? (
          <Bot className="h-5 w-5 text-indigo-400" />
        ) : (
          <User className="h-5 w-5 text-zinc-300" />
        )}
      </div>

      {/* Message Content Area */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Header: Name and Date */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-white">
            {isAssistant ? "CodeMemory Assistant" : "You"}
          </span>
          <span className="text-[11px] text-zinc-500 font-medium">
            {formatDate(createdAt)}
          </span>
        </div>

        {/* Message Text / Markdown */}
        <div className="text-sm leading-7 text-zinc-300">
          {isAssistant ? (
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                    {children}
                  </p>
                ),
                ul: ({ children }) => <ul className="ml-5 list-disc space-y-1.5 py-1">{children}</ul>,
                ol: ({ children }) => <ol className="ml-5 list-decimal space-y-1.5 py-1">{children}</ol>,
                li: ({ children }) => <li className="text-sm leading-7">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                code: ({ children, className }) => (
                  <code
                    className={`rounded bg-zinc-950 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-200 ring-1 ring-zinc-850 ${className ?? ""
                      }`}
                  >
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="overflow-x-auto rounded-2xl bg-zinc-950 p-3.5 font-mono text-xs leading-5 border border-zinc-850 my-2">
                    {children}
                  </pre>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          ) : (
            <div className="whitespace-pre-wrap">{content}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ChatPageView({
  chat,
  embedded = false,
  initialQuery,
  onMessagesPersisted,
}: ChatPageProps) {
  const [messages, setMessages] = React.useState(chat.messages)
  const [draft, setDraft] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const [memoryHits, setMemoryHits] = React.useState<MemoryHit[]>([])
  const bottomRef = React.useRef<HTMLDivElement | null>(null)
  const hasMountedRef = React.useRef(false)

  React.useEffect(() => {
    if (initialQuery) {
      setDraft(initialQuery)
    }
  }, [initialQuery])

  const onMessagesPersistedRef = React.useRef(onMessagesPersisted)
  React.useEffect(() => {
    onMessagesPersistedRef.current = onMessagesPersisted
  })

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, memoryHits])

  React.useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    onMessagesPersistedRef.current?.(messages)
  }, [messages])

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
        messages?: ChatMessage[]
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message ?? "Failed to send message")
      }

      if (data.messages?.length) {
        setMessages((current) => {
          const nextMessages = [
            ...current.filter((entry) => !entry.id.startsWith("temp-user-")),
            ...data.messages!,
          ]
          return nextMessages
        })
      } else {
        setMessages((current) => {
          const nextMessages = [
            ...current.slice(0, -1),
            {
              id: `temp-assistant-${Date.now()}`,
              role: "assistant",
              content: data.reply ?? "No response returned.",
              createdAt: new Date().toISOString(),
            },
          ]
          return nextMessages
        })
      }

      setMemoryHits(data.memoryHits ?? [])
    } catch {
      setMessages((prev) => prev.slice(0, -1))
      setDraft(text)
    } finally {
      setIsSending(false)
    }
  }

  const shellClass = embedded
    ? "relative flex h-full min-h-0 overflow-hidden rounded-[2rem] border border-zinc-850 bg-zinc-900/40 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-md text-zinc-100"
    : "relative min-h-[calc(100vh-72px)] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.03),_transparent_40%),linear-gradient(180deg,#09090b_0%,#09090b_100%)] text-zinc-100"

  return (
    <div className={shellClass}>
      {!embedded && (
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />
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
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-400">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-450" />
                  Repo chat
                </div>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">
                  {chat.title ?? `${chat.repo.owner}/${chat.repo.name}`}
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Ask about commits, files, diffs, or repo history.
                </p>
              </div>

              <a
                href={chat.repo.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-850 hover:text-white"
              >
                Open GitHub
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          )}

          <div className="flex-1 space-y-2 overflow-y-auto px-5 py-5">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[320px] items-center justify-center">
                <Card className="max-w-lg border-dashed border-zinc-850 bg-zinc-900/40 text-white">
                  <CardHeader>
                    <CardTitle className="text-white">Start the conversation</CardTitle>
                    <CardDescription className="text-zinc-450">
                      Ask what changed, how a feature works, or where a bug was introduced.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-zinc-400">
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

          <Separator className="bg-zinc-800" />

          {/* Slack/Discord Inspired Chat Input Area */}
          <div className="p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-850 bg-zinc-950/60 p-2 pl-4 pr-2 shadow-inner">
              {/* Text Input */}
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void handleSend()
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 min-w-0 bg-transparent border-0 py-2 px-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-0"
              />

              {/* Send Button */}
              <button
                onClick={() => void handleSend()}
                disabled={isSending || !draft.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                {isSending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border border-zinc-700 border-t-white" />
                ) : (
                  <SendHorizontal className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </section>

        {!embedded && (
          <aside className="flex flex-col gap-4">
            <Card className="border-zinc-800 bg-zinc-900/30 text-white backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Repository</CardTitle>
                <CardDescription className="text-zinc-450">
                  Memory is synced from this repo and used for recall.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-400">Repo</span>
                  <span className="font-semibold text-white">
                    {chat.repo.owner}/{chat.repo.name}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-400">Commits</span>
                  <span className="font-semibold text-white">{chat.repo.totalCommits}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-400">Files</span>
                  <span className="font-semibold text-white">{chat.repo.totalFiles}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-400">Memory</span>
                  <span className="font-semibold text-white">
                    {chat.repo.indexedAt ? "Indexed" : "Not indexed"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/30 text-white backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Latest memory hits</CardTitle>
                <CardDescription className="text-zinc-450">
                  Matches from the last assistant lookup.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {memoryHits.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    Ask a question to see relevant repo memory here.
                  </p>
                ) : (
                  memoryHits.map((hit) => (
                    <div key={`${hit.sourceType}-${hit.sourceId}`} className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[10px] font-semibold font-mono uppercase tracking-[0.18em] text-indigo-400">
                          {hit.sourceType}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {(hit.similarity * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="mt-1 text-xs font-semibold text-white">
                        {hit.title}
                      </div>
                      <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-[11px] font-mono leading-5 text-zinc-400">
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
