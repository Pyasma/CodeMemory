// Fetching Repo and Pushing to the Database

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/db/prisma"
import { githubClient } from "@/lib/github-client"
import { parseRepoUrl } from "@/lib/url-parser"
import { syncRepository } from "@/lib/sync-repo"
import { getOrCreateDbUser } from "@/lib/fetch-projects"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User isn't authenticated" },
        { status: 401 }
      )
    }

    const user = await getOrCreateDbUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found in database" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { url } = body as { url?: string }

    if (!url) {
      return NextResponse.json(
        { success: false, message: "Repository URL is required" },
        { status: 400 }
      )
    }

    const { owner, repo } = parseRepoUrl(url)
    const github = githubClient()

    const { data: repositoryData } = await github.rest.repos.get({
      owner,
      repo,
    })

    const existingRepository = await prisma.repo.findFirst({
      where: {
        userId: user.id,
        githubRepoId: String(repositoryData.id),
      },
    })

    const repository = existingRepository
      ? await prisma.repo.update({
          where: {
            id: existingRepository.id,
          },
          data: {
            userId: user.id,
            githubUrl: repositoryData.html_url,
            owner: repositoryData.owner.login,
            name: repositoryData.name,
          },
        })
      : await prisma.repo.create({
          data: {
            userId: user.id,
            githubRepoId: String(repositoryData.id),
            githubUrl: repositoryData.html_url,
            owner: repositoryData.owner.login,
            name: repositoryData.name,
          },
        })

    // Call modular sync repository helper!
    await syncRepository(repository.id)

    return NextResponse.json(
      {
        success: true,
        message: "Repo correctly fetched",
        repository,
      },
      { status: 201 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch repository"

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}
