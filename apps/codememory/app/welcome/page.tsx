import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/customs/app-sidebar";
import { Fetch } from "@/lib/fetch-projects";


export default async function dashboard(){
  const repos = await Fetch()
  return (
    <SidebarProvider className="min-h-screen">
        <AppSidebar projects={repos} />
    </SidebarProvider>

  );
}
