import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from './prisma'

async function migrateExistingUsers() {
  const client = await clerkClient()
  let offset = 0
  const limit = 100 // Max 500 per request

  while (true) {
    const { data: users, totalCount } = await client.users.getUserList({
      limit,
      offset,
      orderBy: 'created_at',
    })

    if (users.length === 0) break

    for (const user of users) {
      await prisma.user.upsert({
        where: { clerkId: user.id },
        update: {
          email: user.emailAddresses[0]?.emailAddress ?? '',
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        },
        create: {
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress ?? '',
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        },
      })
    }

    offset += limit
    console.log(`Migrated ${offset} of ${totalCount} users`)

    // Respect rate limits: 1000 req/10s production, 100 req/10s development
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

migrateExistingUsers()
  .then(() => {
    console.log('Migration complete')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })