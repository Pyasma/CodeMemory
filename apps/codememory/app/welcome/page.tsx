import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/customs/app-sidebar";
import { Fetch } from "@/lib/fetch-projects";
import Image from "next/image";
import { Sparkles, Library, Terminal } from "lucide-react";
import { QuickAddRepo } from "@/components/customs/QuickAddRepo";

export default async function Dashboard(){
  const repos = await Fetch()
  return (
    <SidebarProvider className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppSidebar projects={repos} />
      <main className="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-zinc-800/80 bg-zinc-900/40 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-md p-8 relative">
          {/* Decorative glow bg */}
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
          
          <div className="max-w-xl text-center space-y-8 relative z-10 w-full">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative h-16 w-16 rounded-[1.25rem] border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                <Image
                  src="/logo.svg"
                  alt="CodeMemory Logo"
                  width={64}
                  height={64}
                  className="h-full w-full object-contain invert"
                  priority
                />
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Chat with your Repo <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-light">
                  with the Amazing memory of Cognee
                </span>
              </h1>
              <p className="text-sm leading-6 text-zinc-400 max-w-md mx-auto">
                Paste a GitHub repository URL below to start extracting structured graph-based codebase context, or select an existing project from the sidebar.
              </p>
            </div>

            {/* Quick Add Form */}
            <div className="pt-2">
              <QuickAddRepo />
            </div>

            {/* Quick Tips */}
            <div className="grid gap-3 text-left max-w-md mx-auto pt-4">
              <div className="flex gap-4 rounded-2xl border border-white/5 bg-zinc-900/30 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Library className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Indexed Memory</h3>
                  <p className="mt-1 text-xs text-zinc-400">Cognee structures repository commits and files into a semantic network.</p>
                </div>
              </div>
              <div className="flex gap-4 rounded-2xl border border-white/5 bg-zinc-900/30 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                  <Terminal className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-sans">Contextual Recall</h3>
                  <p className="mt-1 text-xs text-zinc-400">Ask questions and retrieve files with exact changes, impact, and history.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
}
