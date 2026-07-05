import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/customs/app-sidebar"
import { Fetch } from "@/lib/fetch-projects"
import { BillingContent } from "@/components/customs/BillingContent"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/db/prisma"

export default async function BillingPage() {
  const repos = await Fetch()
  const { userId } = await auth()

  let isPro = false
  let priceId: string | null = null
  let currentPeriodEnd: string | null = null

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (user) {
      isPro = !!(
        user.stripePriceId &&
        user.stripeCurrentPeriodEnd &&
        user.stripeCurrentPeriodEnd.getTime() + 86_400_000 > Date.now()
      )
      priceId = user.stripePriceId
      currentPeriodEnd = user.stripeCurrentPeriodEnd ? user.stripeCurrentPeriodEnd.toISOString() : null
    }
  }

  return (
    <SidebarProvider className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppSidebar projects={repos} />
      <main className="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        <BillingContent
          subscription={{
            isPro,
            priceId,
            currentPeriodEnd,
          }}
        />
      </main>
    </SidebarProvider>
  )
}
