// Fetching Repo and Pushing to the Database


import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/db/prisma"
import { githubClient } from "@/lib/github-client"
import { parseRepoUrl } from "@/lib/url-parser"
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

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

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

    const [totalFiles, totalCommits] = await Promise.all([
      countFiles(github, owner, repo),
      countCommits(github, owner, repo),
    ])

    const repository = await prisma.repo.create({
      data: {
        userId: user.id,
        githubRepoId: String(repositoryData.id),
        githubUrl: repositoryData.html_url,
        owner: repositoryData.owner.login,
        name: repositoryData.name,
        totalFiles,
        totalCommits,
      },
    })

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

async function countFiles(
  github: ReturnType<typeof githubClient>,
  owner: string,
  repo: string
) {
  const { data: repoDetails } = await github.rest.repos.get({
    owner,
    repo,
  })

  const { data: branch } = await github.rest.repos.getBranch({
    owner,
    repo,
    branch: repoDetails.default_branch,
  })

  const { data: commit } = await github.rest.git.getCommit({
    owner,
    repo,
    commit_sha: branch.commit.sha,
  })

  const { data: tree } = await github.rest.git.getTree({
    owner,
    repo,
    tree_sha: commit.tree.sha,
    recursive: "true",
  })

  return tree.tree.filter((entry) => entry.type === "blob").length
}

async function countCommits(
  github: ReturnType<typeof githubClient>,
  owner: string,
  repo: string
) {
  const response = await github.rest.repos.listCommits({
    owner,
    repo,
    per_page: 1,
  })

  const linkHeader = response.headers.link
  if (!linkHeader) {
    return response.data.length
  }

  const lastPageMatch = linkHeader.match(/&page=(\d+)>; rel="last"/)
  if (!lastPageMatch) {
    return response.data.length
  }

  return Number(lastPageMatch[1])
}
