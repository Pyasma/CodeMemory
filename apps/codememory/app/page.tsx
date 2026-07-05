import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { ClerkHeader } from "@/components/customs/header"
import { ArrowRight, Disc, Layers, Cpu, History } from "lucide-react"
import { InteractiveDemo } from "@/components/customs/InteractiveDemo"

const highlights = [
  {
    title: "Repo memory",
    text: "Each repository keeps its commits, files, and diffs in one place.",
    icon: Layers,
  },
  {
    title: "Agent-ready context",
    text: "Pull the same history into every session without rebuilding the story.",
    icon: Cpu,
  },
  {
    title: "Fast review",
    text: "Scan commit cards, expand diffs, and jump straight to what changed.",
    icon: History,
  },
]

const steps = [
  {
    index: "01",
    title: "Add a repo",
    text: "Paste a GitHub URL and let the fetch flow sync commits and file diffs.",
  },
  {
    index: "02",
    title: "Browse history",
    text: "See a clean commit timeline with expandable IDE-style diffs.",
  },
  {
    index: "03",
    title: "Keep context",
    text: "Every repo stays tied to the person who added it, so nothing duplicates.",
  },
]

export default async function Home() {
  const { userId } = await auth()
  if (userId) {
    redirect("/welcome")
  }
  const primaryHref = "/sign-in"

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-white font-sans">
      {/* Night Landscape Background Scenery Layer */}
      <div className="absolute inset-x-0 top-0 h-[80vh] min-h-[600px] z-0 overflow-hidden">
        <Image
          src="/night-landscape.png"
          alt="Night Landscape Background"
          fill
          priority
          className="object-cover opacity-35 object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-zinc-950/50 to-transparent" />
        
        {/* Glow Effects */}
        <div className="absolute left-1/3 top-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute right-1/4 top-1/3 h-72 w-72 rounded-full bg-purple-500/10 blur-[90px]" />
      </div>

      <ClerkHeader />

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-24 px-6 py-12 sm:px-10 lg:px-12">
        
        {/* Hero Section */}
        <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 pt-8">
          <div className="max-w-3xl">
            {/* CD-ROM Announcement Badge */}
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#BC9BFF]/30 bg-[#BC9BFF]/10 px-4 py-1.5 text-xs text-zinc-200 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-[#BC9BFF] animate-pulse" />
              <span className="font-semibold text-white">Physical Media:</span> Get your public repo on CD-ROM soon!
            </div>

            <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7.5xl leading-[1.1]">
              Your repos, kept in <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">one clean memory.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400 sm:text-xl">
              Add a GitHub repo, sync its commits, and inspect each file diff. CodeMemory uses{" "}
              <a
                href="https://github.com/topoteretes/cognee"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-white hover:text-indigo-400 underline decoration-indigo-500/50 decoration-2 underline-offset-4"
              >
                Cognee AI
              </a>{" "}
              to index and organize your codebase memory into structured, graph-based context ready for every future session.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-zinc-950 shadow-[0_4px_30px_rgba(255,255,255,0.15)] transition-all hover:scale-[1.02] hover:bg-zinc-100"
              >
                {userId ? "Go to Workspace" : "Get Started for Free"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 grid gap-4 grid-cols-3 max-w-md">
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 shadow-sm backdrop-blur-md">
                <div className="text-2xl font-bold text-white">1</div>
                <div className="mt-1 text-xs text-zinc-400">Private projects</div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 shadow-sm backdrop-blur-md">
                <div className="text-2xl font-bold text-white">2</div>
                <div className="mt-1 text-xs text-zinc-400">Commit cards</div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 shadow-sm backdrop-blur-md">
                <div className="text-2xl font-bold text-white">3</div>
                <div className="mt-1 text-xs text-zinc-400">Expandable diffs</div>
              </div>
            </div>
          </div>

          {/* Desktop Preview Card */}
          <div className="relative">
            <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full border border-white/5 bg-indigo-500/5 blur-[2px]" />
            <div className="absolute -right-6 bottom-8 h-16 w-16 rounded-full bg-purple-500/10 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900/60 shadow-[0_30px_80px_rgba(0,0,0,0.4)] backdrop-blur-md">
              <div className="border-b border-white/5 bg-zinc-950/30 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f57]/80" />
                    <span className="h-3 w-3 rounded-full bg-[#febc2e]/80" />
                    <span className="h-3 w-3 rounded-full bg-[#28c840]/80" />
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-zinc-400">
                    workspace preview
                  </div>
                </div>
              </div>

              <InteractiveDemo />
            </div>
          </div>
        </section>

        {/* Feature Cards Grid (Including CD-ROM card) */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="rounded-[1.75rem] border border-white/5 bg-zinc-900/30 p-6 shadow-sm backdrop-blur-md transition-all hover:border-white/10 hover:bg-zinc-900/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-4 text-sm font-semibold uppercase tracking-[0.15em] text-white">
                  {item.title}
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {item.text}
                </p>
              </div>
            )
          })}

          {/* Special CD-ROM Announcement Card */}
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/5 bg-zinc-900/30 p-6 shadow-sm backdrop-blur-md transition-all hover:border-white/10 hover:bg-zinc-900/40">
            <div className="absolute -top-3 -right-3 text-[4.5rem] font-bold text-white/5 font-mono select-none pointer-events-none">CD</div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/10">
              <Disc className="h-5 w-5" style={{ animation: "spin 8s linear infinite" }} />
            </div>
            <div className="mt-4 text-sm font-semibold uppercase tracking-[0.15em] text-white">
              CD-ROM Backups
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-400">
              Your code is physically yours, forever. Keep it. Lend it to friends. Pass it on to your children. Until you lose it, let's be real.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-mono text-purple-400">
              Support coming soon (gh.io/cd)
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] border-t border-white/5 pt-16">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-400">
              How it works
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
              Sync once. Review forever.
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-zinc-400">
              The app stores each repository as a project, keeps it synced, and
              presents the diff history in a clean review flow.
            </p>
          </div>

          <div className="grid gap-4">
            {steps.map((step) => (
              <div
                key={step.index}
                className="flex gap-5 rounded-[1.5rem] border border-white/5 bg-zinc-900/20 p-6 shadow-sm transition-all hover:bg-zinc-900/30"
              >
                <div className="font-mono text-base font-bold text-indigo-400">{step.index}</div>
                <div>
                  <div className="text-base font-semibold text-white">
                    {step.title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-zinc-950 px-6 py-16 sm:px-10 lg:px-12 mt-24">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-start md:justify-between gap-12">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="CodeMemory Logo"
                width={24}
                height={24}
                className="h-6 w-auto select-none invert"
              />
              <span className="text-sm font-semibold tracking-tight text-white">
                CodeMemory
              </span>
            </div>
            <p className="mt-4 text-xs leading-5 text-zinc-400">
              Advanced context representation engine, built upon the Cognee AI data schema standard to keep your AI agents aligned and productive.
            </p>
            <p className="mt-6 text-[11px] text-zinc-500 font-mono">
              &copy; {new Date().getFullYear()} CodeMemory. Built using Cognee memory structures.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Product</h3>
              <ul className="mt-4 space-y-2.5 text-xs text-zinc-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link></li>
                <li><Link href="https://github.com/topoteretes/cognee" target="_blank" className="hover:text-white transition-colors">Cognee AI</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Resources</h3>
              <ul className="mt-4 space-y-2.5 text-xs text-zinc-400">
                <li><a href="https://github.com/topoteretes/cognee" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub Repo</a></li>
                <li><a href="https://gh.io/cd" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">CD-ROM Backup (joke)</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Company</h3>
              <ul className="mt-4 space-y-2.5 text-xs text-zinc-400">
                <li><span className="text-zinc-600">About</span></li>
                <li><span className="text-zinc-600">Blog</span></li>
                <li><span className="text-zinc-600">Careers</span></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
