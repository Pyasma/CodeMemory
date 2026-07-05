"use client"

import * as React from "react"
import { Plus, MessagesSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RepoMain } from "@/components/customs/Repo-Card"
import { ChatPageView } from "@/components/customs/chat-page"

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
  const [activeTab, setActiveTab] = React.useState<"repo" | "chat">("repo")
  const [chats, setChats] = React.useState(repo.chats ?? [])
  const [activeChatId, setActiveChatId] = React.useState<string | null>(
    repo.chats?.[0]?.id ?? null
  )
  const [isCreatingChat, setIsCreatingChat] = React.useState(false)

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

  async function handleCreateChat() {
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
      setActiveTab("chat")
    } finally {
      setIsCreatingChat(false)
    }
  }

  const selectedChat = activeChat ? toChatView(activeChat, repo) : null

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-background/90 px-5 py-4">
        <div className="inline-flex rounded-full border border-border bg-muted p-1">
          <button
            type="button"
            onClick={() => setActiveTab("repo")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "repo"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Repo
          </button>
          <button
            type="button"
            onClick={openChatTab}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "chat"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessagesSquare className="h-4 w-4" />
            Chat
          </button>
        </div>

        {activeTab === "chat" && (
          <Button
            type="button"
            onClick={() => void handleCreateChat()}
            disabled={isCreatingChat}
            className="rounded-full"
          >
            <Plus className="h-4 w-4" />
            {isCreatingChat ? "Creating..." : "New chat"}
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === "repo" ? (
          <div className="h-full overflow-y-auto p-5">
            <RepoMain repo={{ commits: repo.commits }} />
          </div>
        ) : selectedChat ? (
          <div className="flex h-full min-h-0 flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => setActiveChatId(chat.id)}
                    className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                      chat.id === activeChatId
                        ? "border-foreground/10 bg-foreground text-background"
                        : "border-border bg-muted/30 text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {chat.title ?? "Untitled chat"}
                  </button>
                ))}
              </div>

              <Button
                type="button"
                onClick={() => void handleCreateChat()}
                disabled={isCreatingChat}
                className="rounded-full"
              >
                <Plus className="h-4 w-4" />
                {isCreatingChat ? "Creating..." : "New chat"}
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              <ChatPageView
                key={selectedChat.id}
                chat={selectedChat}
                embedded
                onMessagesPersisted={(messages) =>
                  handlePersistedMessages(selectedChat.id, messages)
                }
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-5">
            <Card className="max-w-lg border-dashed bg-muted/35">
              <CardHeader>
                <CardTitle>No chat yet</CardTitle>
                <CardDescription>
                  Create the first conversation for this repo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => void handleCreateChat()} disabled={isCreatingChat}>
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
