import { AppSidebar } from "@/components/customs/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Fetch } from "@/lib/fetch-projects"

export default async function RepoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const repos = await Fetch()

  return (
    <SidebarProvider className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppSidebar projects={repos} />
      <main className="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex h-full w-full flex-col overflow-hidden rounded-[2rem] border border-zinc-800/80 bg-zinc-900/40 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-md">
          <div className="min-h-0 flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </main>
    </SidebarProvider>
  )
}
