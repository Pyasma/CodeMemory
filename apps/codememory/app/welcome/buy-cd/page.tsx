import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/customs/app-sidebar";
import { Fetch } from "@/lib/fetch-projects";
import { BuyCDContent } from "@/components/customs/BuyCDContent";

export default async function BuyCDPage(){
  const repos = await Fetch()
  return (
    <SidebarProvider className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppSidebar projects={repos} />
      <main className="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        <BuyCDContent projects={repos} />
      </main>
    </SidebarProvider>
  );
}
