import "server-only"

import { prisma } from "@/db/prisma"
import { auth, currentUser } from "@clerk/nextjs/server"

async function userAuth() {
    const { userId } = await auth()
    return { userId }
}

export async function getOrCreateDbUser() {
  const { userId } = await userAuth()
  if (!userId) return null

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    const clerkUser = await currentUser()
    if (clerkUser) {
      user = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
        },
      })
    }
  }

  return user
}

export async function Fetch() {
  const user = await getOrCreateDbUser()
  if (!user) {
    return []
  }

  const repos = await prisma.repo.findMany({
    where: { userId: user.id },
  })

  return repos
}

export async function FetchRepoContent(repoId: string) {
    const user = await getOrCreateDbUser()
    if (!user) return null

    const repo = await prisma.repo.findFirst({
        where: {
            id: repoId,
            userId: user.id,
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
            chats: {
              orderBy: {
                updatedAt: "desc",
              },
              include: {
                messages: {
                  orderBy: {
                    createdAt: "asc",
                  },
                },
              },
            },
        },
    })

    return repo
}
