"use client"

import * as React from "react"
import { Plus, MessagesSquare, X, Trash2, Brain } from "lucide-react"
import { useRouter } from "next/navigation"
import { MemoryGraph } from "@/components/customs/MemoryGraph"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RepoMain } from "@/components/customs/Repo-Card"
import { ChatPageView } from "@/components/customs/chat-page"
import { toast } from "sonner"

type RepoChat = {
  id: string
  title: string | null
  createdAt: string | Date
  updatedAt: string | Date
  messages: {
    id: string
    role: string
    content: string
    createdAt: string | Date
  }[]
}

type RepoTabsProps = {
  repo: {
    id: string
    owner: string
    name: string
    githubUrl: string
    totalFiles: number
    totalCommits: number
    indexedAt: string | Date | null
    commits: React.ComponentProps<typeof RepoMain>["repo"]["commits"]
    chats: RepoChat[]
  }
}

function toChatView(chat: RepoChat, repo: RepoTabsProps["repo"]) {
  return {
    id: chat.id,
    title: chat.title,
    repo: {
      id: repo.id,
      owner: repo.owner,
      name: repo.name,
      githubUrl: repo.githubUrl,
      totalFiles: repo.totalFiles,
      totalCommits: repo.totalCommits,
      indexedAt: repo.indexedAt,
    },
    messages: (chat.messages ?? []).map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt:
        message.createdAt instanceof Date
          ? message.createdAt.toISOString()
          : message.createdAt,
    })),
  }
}

export function RepoTabs({ repo }: RepoTabsProps) {
  const [activeTab, setActiveTab] = React.useState<"repo" | "chat" | "memory">("repo")
  const [chats, setChats] = React.useState(repo.chats ?? [])
  const [activeChatId, setActiveChatId] = React.useState<string | null>(
    repo.chats?.[0]?.id ?? null
  )
  const [isCreatingChat, setIsCreatingChat] = React.useState(false)
  const [isDeletingRepo, setIsDeletingRepo] = React.useState(false)
  const [initialQuery, setInitialQuery] = React.useState("")
  const router = useRouter()

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null

  function handlePersistedMessages(chatId: string, messages: RepoChat["messages"]) {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages,
            }
          : chat
      )
    )
  }

  function openChatTab() {
    if (!activeChatId && chats[0]) {
      setActiveChatId(chats[0].id)
    }

    setActiveTab("chat")
  }

  async function handleCreateChat(initialQuery = "") {
    if (isCreatingChat) {
      return
    }

    setIsCreatingChat(true)

    try {
      const response = await fetch(`/api/repos/${repo.id}/chats`, {
        method: "POST",
      })

      const data = (await response.json()) as {
        success: boolean
        message?: string
        chat?: RepoChat
      }

      if (!response.ok || !data.success || !data.chat) {
        throw new Error(data.message ?? "Failed to create chat")
      }

      const nextChat = data.chat as RepoChat

      setChats((prev) => [nextChat, ...prev])
      setActiveChatId(nextChat.id)
      setInitialQuery(initialQuery)
      setActiveTab("chat")
      toast.success("New chat session created!")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create chat")
    } finally {
      setIsCreatingChat(false)
    }
  }

  async function handleDeleteChat(chatId: string) {
    if (!confirm("Are you sure you want to delete this chat session?")) {
      return
    }

    try {
      const response = await fetch(`/api/repos/${repo.id}/chats/${chatId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete chat")
      }

      const updatedChats = chats.filter((chat) => chat.id !== chatId)
      setChats(updatedChats)
      
      if (activeChatId === chatId) {
        setActiveChatId(updatedChats[0]?.id ?? null)
      }

      toast.success("Chat deleted successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete chat")
    }
  }

  async function handleDeleteRepo() {
    if (!confirm(`Are you sure you want to delete ${repo.name}? All chats and indexed files will be permanently deleted.`)) {
      return
    }

    setIsDeletingRepo(true)

    try {
      const response = await fetch(`/api/repos/${repo.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete repository")
      }

      toast.success("Repository deleted successfully!")
      router.push("/welcome")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete repository")
    } finally {
      setIsDeletingRepo(false)
    }
  }

  function handleQueryCommit(sha: string) {
    const commit = repo.commits.find((c) => c.sha === sha)
    const text = `Explain the changes in commit ${sha.slice(0, 7)}: "${commit?.message ?? ""}"`
    void handleCreateChat(text)
  }

  const selectedChat = activeChat ? toChatView(activeChat, repo) : null

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-zinc-950/40 text-zinc-100">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800/80 bg-zinc-900/10 px-5 py-4 backdrop-blur-md">
        <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("repo")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
              activeTab === "repo"
                ? "bg-zinc-805 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Repo
          </button>
          <button
            type="button"
            onClick={openChatTab}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
              activeTab === "chat"
                ? "bg-zinc-805 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <MessagesSquare className="h-4 w-4" />
            Chat
          </button>
          <button
            type="button"
            onClick={() => {
              setInitialQuery("")
              setActiveTab("memory")
            }}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
              activeTab === "memory"
                ? "bg-zinc-805 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Brain className="h-4 w-4" />
            Memory Graph
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "chat" && (
            <Button
              type="button"
              onClick={() => void handleCreateChat()}
              disabled={isCreatingChat}
              className="rounded-full bg-white text-zinc-950 hover:bg-zinc-200 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {isCreatingChat ? "Creating..." : "New chat"}
            </Button>
          )}

          <Button
            type="button"
            onClick={() => void handleDeleteRepo()}
            disabled={isDeletingRepo}
            className="rounded-full border border-rose-950 bg-rose-950/20 text-rose-450 hover:bg-rose-900/30 hover:text-rose-100 transition-colors cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeletingRepo ? "Deleting..." : "Delete Repo"}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === "repo" ? (
          <div className="h-full overflow-y-auto p-5">
            <RepoMain repo={{ commits: repo.commits }} />
          </div>
        ) : activeTab === "memory" ? (
          <div className="h-full p-5">
            <MemoryGraph commits={repo.commits} repoName={`${repo.owner}/${repo.name}`} onQueryCommit={handleQueryCommit} />
          </div>
        ) : selectedChat ? (
          <div className="flex h-full min-h-0 flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors ${
                      chat.id === activeChatId
                        ? "border-white/10 bg-white text-zinc-950"
                        : "border-zinc-850 bg-zinc-900/30 text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveChatId(chat.id)}
                      className="text-left font-medium cursor-pointer"
                    >
                      {chat.title ?? "Untitled chat"}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleDeleteChat(chat.id)
                      }}
                      className={`ml-1 rounded-full p-0.5 transition-colors cursor-pointer ${
                        chat.id === activeChatId
                          ? "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
                          : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                      }`}
                      aria-label="Delete chat"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              <ChatPageView
                key={selectedChat.id}
                chat={selectedChat}
                embedded
                initialQuery={initialQuery}
                onMessagesPersisted={(messages) =>
                  handlePersistedMessages(selectedChat.id, messages)
                }
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-5">
            <Card className="max-w-lg border-dashed border-zinc-850 bg-zinc-900/40 text-white">
              <CardHeader>
                <CardTitle className="text-white">No chat yet</CardTitle>
                <CardDescription className="text-zinc-450">
                  Create the first conversation for this repo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => void handleCreateChat()} 
                  disabled={isCreatingChat}
                  className="rounded-full bg-white text-zinc-950 hover:bg-zinc-200 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  {isCreatingChat ? "Creating..." : "Start chat"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
