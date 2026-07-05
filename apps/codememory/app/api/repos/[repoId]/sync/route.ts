import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/db/prisma"
import { syncRepository } from "@/lib/sync-repo"

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
      select: {
        id: true,
      },
    })

    if (!repo) {
      return NextResponse.json(
        { success: false, message: "Repository not found" },
        { status: 404 }
      )
    }

    await syncRepository(repo.id)

    return NextResponse.json(
      { success: true, message: "Repository synced successfully" },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync error"
    console.error("[Sync Repo API Error]:", message)

    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
