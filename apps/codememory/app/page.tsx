import Image from "next/image"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { ClerkHeader } from "@/components/customs/header"

const highlights = [
  {
    title: "Repo memory",
    text: "Each repository keeps its commits, files, and diffs in one place.",
  },
  {
    title: "Agent-ready context",
    text: "Pull the same history into every session without rebuilding the story.",
  },
  {
    title: "Fast review",
    text: "Scan commit cards, expand diffs, and jump straight to what changed.",
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
  const primaryHref = userId ? "/welcome" : "/sign-in"
  const primaryLabel = userId ? "Open app" : "Sign in"

  return (
    <div className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#f5f1ea] text-stone-950">
      <ClerkHeader />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top_left,_rgba(17,17,17,0.08),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(17,17,17,0.06),_transparent_32%)]" />
        <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-stone-950/5 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(17,17,17,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.03)_1px,transparent_1px)] bg-[size:28px_28px] opacity-35" />
      </div>

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-20 px-6 py-8 sm:px-10 lg:px-12">
        <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-stone-300/80 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-stone-600 shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-stone-950" />
              CodeMemory
            </div>

            <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-stone-950 sm:text-6xl lg:text-7xl">
              Your repos, kept in one clean memory.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600 sm:text-xl">
              Add a GitHub repo, sync its commits, and inspect each file diff in
              an editorial, agent-friendly workspace. No duplicate projects.
              No context hunting.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.01]"
              >
                {primaryLabel}
              </Link>
              <Link
                href="/welcome"
                className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white/70 px-5 py-3 text-sm font-medium text-stone-950 backdrop-blur transition-colors hover:bg-white"
              >
                View workspace
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-300/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                <div className="text-2xl font-semibold">1</div>
                <div className="mt-1 text-sm text-stone-600">Private projects</div>
              </div>
              <div className="rounded-2xl border border-stone-300/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                <div className="text-2xl font-semibold">2</div>
                <div className="mt-1 text-sm text-stone-600">Commit cards</div>
              </div>
              <div className="rounded-2xl border border-stone-300/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                <div className="text-2xl font-semibold">3</div>
                <div className="mt-1 text-sm text-stone-600">Expandable diffs</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full border border-stone-300/80 bg-white/60 blur-[1px]" />
            <div className="absolute -right-6 bottom-8 h-16 w-16 rounded-full bg-stone-950/10 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-stone-300/80 bg-white/85 shadow-[0_30px_80px_rgba(0,0,0,0.08)] backdrop-blur">
              <div className="border-b border-stone-200 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      workspace preview
                    </div>
                    <div className="mt-1 text-sm text-stone-700">
                      Commit history with IDE-style diffs
                    </div>
                  </div>
                  <div className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs text-stone-600">
                    live
                  </div>
                </div>
              </div>

              <div className="grid gap-0 lg:grid-cols-[0.72fr_1fr]">
                <div className="border-b border-stone-200 bg-stone-50/90 p-5 lg:border-b-0 lg:border-r">
                  <div className="rounded-[1.5rem] border border-stone-300 bg-[#0b1020] p-4 shadow-inner">
                    <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-300">
                      <span>commit view</span>
                      <span>5 commits</span>
                    </div>
                    <div className="relative aspect-[4/6] overflow-hidden rounded-2xl border border-white/10 bg-black">
                      <Image
                        src="/image.png"
                        alt="CodeMemory preview"
                        fill
                        className="object-cover opacity-95"
                        priority
                        sizes="(max-width: 1024px) 100vw, 480px"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="rounded-[1.5rem] border border-stone-200 bg-stone-950 px-4 py-4 text-stone-100 shadow-inner">
                    <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-stone-400">
                      /repo/[repoId]
                    </div>
                    <div className="mt-3 space-y-3 font-mono text-sm leading-6">
                      <div className="text-emerald-300">+ expand commit</div>
                      <div className="text-emerald-300">+ inspect file diffs</div>
                      <div className="text-slate-300">+ keep projects organized</div>
                      <div className="text-slate-300">+ reuse context across agents</div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-white p-4">
                    <div className="text-sm font-medium text-stone-950">
                      Built for long-lived context.
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      CodeMemory keeps your repo history readable, structured, and
                      ready for every future session.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-[1.75rem] border border-stone-300/80 bg-white/80 p-6 shadow-sm backdrop-blur"
            >
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
                {item.title}
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                {item.text}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
              <div className="text-sm font-medium uppercase tracking-[0.22em] text-stone-500">
              How it works
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
              Sync once. Review forever.
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-stone-600">
              The app stores each repository as a project, keeps it synced, and
              presents the diff history in a clean review flow.
            </p>
          </div>

          <div className="grid gap-4">
            {steps.map((step) => (
              <div
                key={step.index}
                className="flex gap-4 rounded-[1.5rem] border border-stone-300/80 bg-white/85 p-5 shadow-sm"
              >
                <div className="font-mono text-sm text-stone-400">{step.index}</div>
                <div>
                  <div className="text-base font-medium text-stone-950">
                    {step.title}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
