import { prisma } from "@/db/prisma"
import { githubClient } from "@/lib/github-client"
import { syncRepoMemory } from "@/lib/repo-memory"

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

export async function syncRepository(repoId: string) {
  const repository = await prisma.repo.findUnique({
    where: { id: repoId },
  })

  if (!repository) {
    throw new Error(`Repository ${repoId} not found`)
  }

  const owner = repository.owner
  const repo = repository.name
  const github = githubClient()

  // 1. Fetch total files and commits counts
  const [totalFiles, totalCommits] = await Promise.all([
    countFiles(github, owner, repo),
    countCommits(github, owner, repo),
  ])

  // 2. Fetch list of 100 commits from github
  const commitsResponse = await github.rest.repos.listCommits({
    owner,
    repo,
    per_page: 100,
  })

  // 3. Update repo counts in database
  await prisma.repo.update({
    where: { id: repository.id },
    data: {
      totalFiles,
      totalCommits,
      indexedAt: new Date(),
    },
  })

  // 4. Delete existing files and commits for this repo (cascade delete simulation)
  const existingCommitIds = await prisma.commit.findMany({
    where: { repoId: repository.id },
    select: { id: true },
  })

  await prisma.commitFile.deleteMany({
    where: {
      commitId: {
        in: existingCommitIds.map((commit) => commit.id),
      },
    },
  })

  await prisma.commit.deleteMany({
    where: { repoId: repository.id },
  })

  // 5. Create commits (deduplicated by SHA)
  const uniqueCommits = Array.from(
    new Map(commitsResponse.data.map((c) => [c.sha, c])).values()
  )

  await prisma.commit.createMany({
    data: uniqueCommits.map((commit) => ({
      repoId: repository.id,
      sha: commit.sha,
      message: commit.commit.message,
      authorName: commit.commit.author?.name ?? "Unknown",
      authorImage: commit.author?.avatar_url ?? null,
      committedAt: new Date(commit.commit.author?.date ?? Date.now()),
      summary: null,
    })),
  })

  // 6. Fetch details for each commit and insert files
  const storedCommits = await prisma.commit.findMany({
    where: {
      repoId: repository.id,
      sha: {
        in: uniqueCommits.map((commit) => commit.sha),
      },
    },
    select: {
      id: true,
      sha: true,
    },
  })

  const commitIdBySha = new Map(
    storedCommits.map((commit) => [commit.sha, commit.id])
  )

  const commitFilesData = await Promise.all(
    uniqueCommits.map(async (commit) => {
      const commitId = commitIdBySha.get(commit.sha)
      if (!commitId) {
        return []
      }

      const { data: commitDetails } = await github.rest.repos.getCommit({
        owner,
        repo,
        ref: commit.sha,
      })

      return (
        commitDetails.files?.map((file) => ({
          commitId,
          filePath: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          patch: file.patch ?? null,
        })) ?? []
      )
    })
  )

  await prisma.commitFile.createMany({
    data: commitFilesData.flat(),
  })

  // 7. Sync memory representation via Cognee
  try {
    await syncRepoMemory(repository.id)
  } catch (error) {
    console.warn(`[syncRepository] memory sync failed for ${repository.id}:`, error)
  }
}
