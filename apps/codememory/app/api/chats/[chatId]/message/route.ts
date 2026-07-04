import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/db/prisma"
import { generateGeminiReply } from "@/lib/gemini"
import { searchRepoMemory } from "@/lib/repo-memory"

type ChatMessageBody = {
  message?: string
}

const CHAT_SYSTEM_MESSAGE =
  "You are CodeMemory's repo chat assistant. Answer using only the provided repo context, recent conversation, and memory hits. If the answer is uncertain, say what is missing. Be concise and specific."

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User isn't authenticated" },
        { status: 401 }
      )
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
          take: 12,
        },
      },
    })

    if (!chat || !chat.repo) {
      return NextResponse.json(
        { success: false, message: "Chat not found" },
        { status: 404 }
      )
    }

    const body = (await req.json()) as ChatMessageBody
    const message = body.message?.trim()

    if (!message) {
      return NextResponse.json(
        { success: false, message: "message is required" },
        { status: 400 }
      )
    }

    const memoryHits = await searchRepoMemory(chat.repoId, message, 5)

    const context = [
      `Repository: ${chat.repo.owner}/${chat.repo.name}`,
      `GitHub URL: ${chat.repo.githubUrl}`,
      "",
      "Recent conversation:",
      ...chat.messages.map((entry) => `${entry.role.toUpperCase()}: ${entry.content}`),
      "",
      "Relevant memory hits:",
      ...memoryHits.map(
        (hit, index) =>
          `${index + 1}. [${hit.sourceType}] ${hit.title}\n${hit.content}`
      ),
      "",
      `User question: ${message}`,
    ].join("\n")

    const reply = await generateGeminiReply({
      info: context,
      systemMessage: CHAT_SYSTEM_MESSAGE,
    })

    await prisma.$transaction(async (tx) => {
      await tx.message.create({
        data: {
          chatId: chat.id,
          role: "user",
          content: message,
        },
      })

      await tx.message.create({
        data: {
          chatId: chat.id,
          role: "assistant",
          content: reply || "I could not generate a response.",
        },
      })

      if (!chat.title) {
        await tx.chat.update({
          where: { id: chat.id },
          data: {
            title:
              message.length > 60
                ? `${message.slice(0, 57)}...`
                : message,
          },
        })
      } else {
        await tx.chat.update({
          where: { id: chat.id },
          data: {
            updatedAt: new Date(),
          },
        })
      }
    })

    return NextResponse.json(
      {
        success: true,
        reply,
        memoryHits,
      },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send chat message"

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}

