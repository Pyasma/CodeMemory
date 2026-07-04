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
    <SidebarProvider className="min-h-screen bg-[#f7f5f1]">
      <AppSidebar projects={repos} />
      <main className="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex h-full w-full flex-col overflow-hidden rounded-[2rem] border border-border/60 bg-background/80 shadow-[0_20px_60px_rgba(0,0,0,0.06)] backdrop-blur">
          <div className="min-h-0 flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </main>
    </SidebarProvider>
  )
}
