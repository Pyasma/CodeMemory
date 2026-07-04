import { notFound } from "next/navigation"

import { auth } from "@clerk/nextjs/server"

import { prisma } from "@/db/prisma"
import { ChatPageView } from "@/components/customs/chat-page"

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  const { userId } = await auth()

  if (!userId) {
    notFound()
  }

  const { chatId } = await params

  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      repo: {
        user: {
          clerkId: userId,
        },
      },
    },
    include: {
      repo: true,
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  })

  if (!chat || !chat.repo) {
    notFound()
  }

  return (
    <ChatPageView
      chat={{
        id: chat.id,
        title: chat.title,
        repo: {
          id: chat.repo.id,
          owner: chat.repo.owner,
          name: chat.repo.name,
          githubUrl: chat.repo.githubUrl,
          totalFiles: chat.repo.totalFiles,
          totalCommits: chat.repo.totalCommits,
          indexedAt: chat.repo.indexedAt ? chat.repo.indexedAt.toISOString() : null,
        },
        messages: chat.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
        })),
      }}
    />
  )
}
