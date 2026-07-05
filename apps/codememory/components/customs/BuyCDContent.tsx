"use client"

import * as React from "react"
import Image from "next/image"
import { Disc, ArrowUpRight } from "lucide-react"

type Project = {
  id: string
  name: string
  githubUrl: string
}

export function BuyCDContent({ projects = [] }: { projects: Project[] }) {
  const [selectedRepo, setSelectedRepo] = React.useState(projects[0]?.name ?? "")
  const [shippingAddress, setShippingAddress] = React.useState("")
  const [isOrdered, setIsOrdered] = React.useState(false)

  React.useEffect(() => {
    if (projects.length > 0 && !selectedRepo) {
      setSelectedRepo(projects[0].name)
    }
  }, [projects, selectedRepo])

  function handleOrder(e: React.FormEvent) {
    e.preventDefault()
    setIsOrdered(true)
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto rounded-[2rem] border border-zinc-800/80 bg-zinc-900/40 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-md p-6 sm:p-10 relative">
      <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#BC9BFF]/5 blur-[120px] pointer-events-none" />

      {isOrdered ? (
        <div className="flex h-full flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto relative z-10 py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#BC9BFF]/10 text-[#BC9BFF] border border-[#BC9BFF]/20">
            <Disc className="h-8 w-8" style={{ animation: "spin 2s linear infinite" }} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Your CD-ROM Order is Placed!</h1>
            <p className="text-sm leading-6 text-zinc-400">
              We've processed your repository backup request for <span className="text-white font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-800">{selectedRepo}</span>.
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-4 text-xs text-zinc-400 text-left space-y-2 font-mono">
            <p>💿 Keep it. Lend it to friends. Pass it on to your children.</p>
            <p>🔒 Your code is physically yours, forever.</p>
            <p>⚠️ Until you lose it, let's be real.</p>
          </div>
          <button
            onClick={() => setIsOrdered(false)}
            className="rounded-full bg-white text-zinc-950 px-6 py-2.5 text-xs font-semibold hover:bg-zinc-200 transition-all cursor-pointer"
          >
            Order another CD
          </button>
        </div>
      ) : (
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] relative z-10 h-fit">
          
          {/* Checkout Form */}
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#BC9BFF]/30 bg-[#BC9BFF]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-[#BC9BFF]">
                <Disc className="h-3.5 w-3.5" style={{ animation: "spin 6s linear infinite" }} />
                Physical media is back
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Order Your Repo on CD-ROM
              </h1>
              <p className="text-sm text-zinc-400 leading-6">
                Your code is physically yours, forever. Keep it. Lend it to friends. Pass it on to your children. Until you lose it, let's be real.
              </p>
            </div>

            <form onSubmit={handleOrder} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Select Repository</label>
                <select
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 focus:border-zinc-705 focus:outline-none"
                >
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.name}>
                      {proj.name} ({proj.githubUrl})
                    </option>
                  ))}
                  {projects.length === 0 && (
                    <option value="">No projects available</option>
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Shipping Address</label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter your shipping details..."
                  required
                  rows={3}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 focus:border-zinc-705 focus:outline-none resize-none"
                />
              </div>

              <div className="rounded-2xl border border-zinc-855 bg-zinc-950/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Standard 700MB CD-R</span>
                  <span className="font-semibold text-white">Free (Joke)</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Shipping & Handling</span>
                  <span className="font-semibold text-white">Free</span>
                </div>
                <div className="border-t border-zinc-855 pt-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-zinc-300">Total Price</span>
                  <span className="font-bold text-[#BC9BFF] font-mono text-base">$0.00</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={projects.length === 0}
                className="w-full rounded-full bg-white text-zinc-950 py-3.5 text-sm font-semibold hover:bg-zinc-200 transition-all shadow-[0_4px_30px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Order yours today
              </button>
            </form>
          </div>

          {/* Social Proof Announcement Mock */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-9 w-9 rounded-full bg-[#1da1f2]/10 flex items-center justify-center text-[#1da1f2]">
                    <span className="font-bold text-sm">X</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">GitHub Announcement</h4>
                    <p className="text-[10px] text-zinc-500">Official Status Update</p>
                  </div>
                </div>
                <a
                  href="https://x.com/github/status/2072801888525840476"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>

              {/* Official Tweet Embed with original video */}
              <div className="relative h-[460px] w-full overflow-hidden rounded-2xl border border-white/5 bg-zinc-950">
                <iframe
                  src="https://platform.twitter.com/embed/Tweet.html?id=2072801888525840476&theme=dark"
                  className="absolute inset-0 h-full w-full border-0"
                  title="GitHub CD-ROM Tweet Video"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                  scrolling="no"
                />
              </div>

              <p className="text-xs leading-5 text-zinc-450">
                You can obtain your public repo on CD-ROM. Keep it. Lend it to friends. Pass it on to your children. Your code is physically yours, forever. (See the official announcement thread above).
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
