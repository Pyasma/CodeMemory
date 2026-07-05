import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/db/prisma"
import { NextResponse } from "next/server"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User isn't authenticated" },
        { status: 401 }
      )
    }

    const { repoId } = await params

    // Verify the repo belongs to this user
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User not found in database" },
        { status: 404 }
      )
    }

    const repo = await prisma.repo.findFirst({
      where: {
        id: repoId,
        userId: dbUser.id,
      },
    })

    if (!repo) {
      return NextResponse.json(
        { success: false, message: "Repository not found or unauthorized" },
        { status: 404 }
      )
    }

    // Cascade delete related records
    // 1. Delete messages in chats
    const chats = await prisma.chat.findMany({
      where: { repoId: repo.id },
      select: { id: true },
    })

    await prisma.message.deleteMany({
      where: {
        chatId: {
          in: chats.map((c) => c.id),
        },
      },
    })

    // 2. Delete chats
    await prisma.chat.deleteMany({
      where: { repoId: repo.id },
    })

    // 3. Delete commit files
    const commits = await prisma.commit.findMany({
      where: { repoId: repo.id },
      select: { id: true },
    })

    await prisma.commitFile.deleteMany({
      where: {
        commitId: {
          in: commits.map((c) => c.id),
        },
      },
    })

    // 4. Delete commits
    await prisma.commit.deleteMany({
      where: { repoId: repo.id },
    })

    // 5. Delete repository
    await prisma.repo.delete({
      where: { id: repo.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete error"
    console.error("[Delete Repo API Error]:", message)
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
