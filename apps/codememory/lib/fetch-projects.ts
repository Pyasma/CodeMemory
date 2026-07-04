import "server-only"

import { prisma } from "@/db/prisma"
import { auth } from "@clerk/nextjs/server"

async function userAuth() {
    const { userId } = await auth()
    return { userId }
}

export async function Fetch() {
    const { userId } = await userAuth()

  if (!userId) {
    return []
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      repos: true,
    },
  })

  return user?.repos ?? []
}


export async function FetchRepoContent(repoId: string) {
    const { userId } = await userAuth()

    if (!userId) return null

    const repo = await prisma.repo.findFirst({
        where: {
            id: repoId,
            user: {
                clerkId: userId,
            },
        },
        include: {
            commits: {
                include: {
                files: true,
                },
                orderBy: {
                committedAt: "desc",
                },
            },
        },
    })

    return repo
}