import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/db/prisma"
import { searchRepoMemory } from "@/lib/repo-memory"

export async function POST(
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

    const body = (await req.json()) as { query?: string; limit?: number }
    const query = body.query?.trim()
    const limit = body.limit ?? 5

    if (!query) {
      return NextResponse.json(
        { success: false, message: "query is required" },
        { status: 400 }
      )
    }

    const results = await searchRepoMemory(repoId, query, limit)

    return NextResponse.json(
      {
        success: true,
        results,
      },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search repo memory"

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}

