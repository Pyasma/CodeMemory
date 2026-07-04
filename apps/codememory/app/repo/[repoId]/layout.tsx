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
    <SidebarProvider className="min-h-screen">
      <AppSidebar projects={repos} />
      <main className="min-h-0 flex-1 overflow-hidden p-6 sm:p-8 md:ml-4 md:mt-4 md:mr-4 md:mb-4">
        <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-2">
            {children}
          </div>
        </div>
      </main>
    </SidebarProvider>
  )
}
