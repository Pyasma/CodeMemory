import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/customs/app-sidebar";
import { Fetch } from "@/lib/fetch-projects";


export default async function dashboard(){
  const repos = await Fetch()
  return (
    <SidebarProvider className="min-h-screen">
        <AppSidebar projects={repos} />
        <main className="min-h-0 flex-1 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 md:ml-4 md:mt-4 md:mr-4 md:mb-4">
        </main>
    </SidebarProvider>

  );
}
