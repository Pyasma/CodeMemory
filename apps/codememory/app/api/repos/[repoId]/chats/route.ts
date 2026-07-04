import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/db/prisma"

export async function POST(
  _req: Request,
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

    const chat = await prisma.chat.create({
      data: {
        repoId: repo.id,
        title: `${repo.owner}/${repo.name}`,
      },
    })

    return NextResponse.json(
      {
        success: true,
        chat,
      },
      { status: 201 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create chat"

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}

