import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/db/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ repoId: string; chatId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User isn't authenticated" },
        { status: 401 }
      )
    }

    const { repoId, chatId } = await params

    // Verify repository ownership
    const repo = await prisma.repo.findFirst({
      where: {
        id: repoId,
        user: {
          clerkId: userId,
        },
      },
    })

    if (!repo) {
      return NextResponse.json(
        { success: false, message: "Repo not found" },
        { status: 404 }
      )
    }

    // Verify chat ownership/relation
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        repoId: repo.id,
      },
    })

    if (!chat) {
      return NextResponse.json(
        { success: false, message: "Chat not found" },
        { status: 404 }
      )
    }

    // Delete associated messages first to avoid foreign key violations
    await prisma.message.deleteMany({
      where: {
        chatId: chat.id,
      },
    })

    // Delete the chat session
    await prisma.chat.delete({
      where: {
        id: chat.id,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Chat deleted successfully",
      },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete chat"

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}
