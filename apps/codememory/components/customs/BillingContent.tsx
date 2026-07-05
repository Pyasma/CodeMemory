"use client"

import * as React from "react"
import { CreditCard, CheckCircle, Disc, Loader2, ArrowUpRight } from "lucide-react"
import { toast } from "sonner"

interface BillingContentProps {
  subscription: {
    isPro: boolean
    priceId: string | null
    currentPeriodEnd: string | null
  }
}

export function BillingContent({ subscription }: BillingContentProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search)
      if (searchParams.get("success")) {
        toast.success("Subscription updated successfully! Welcome to Pro.")
      }
      if (searchParams.get("canceled")) {
        toast.error("Subscription checkout cancelled.")
      }
    }
  }, [])

  async function handleBillingAction() {
    setIsLoading(true)
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
      })

      const data = (await response.json()) as {
        success: boolean
        url?: string
        message?: string
      }

      if (!response.ok || !data.success || !data.url) {
        throw new Error(data.message ?? "Failed to initiate billing action")
      }

      window.location.href = data.url
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Billing portal error")
      setIsLoading(false)
    }
  }

  const formattedPeriodEnd = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto rounded-[2rem] border border-zinc-800/80 bg-zinc-900/40 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-md p-6 sm:p-10 relative">
      <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#BC9BFF]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10 w-full">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#BC9BFF]/30 bg-[#BC9BFF]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-[#BC9BFF]">
            <CreditCard className="h-3.5 w-3.5" />
            Billing portal
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Manage your Subscription
          </h1>
          <p className="text-sm text-zinc-400 leading-6 max-w-xl">
            Upgrade your plan to unlock advanced Cognee graph visualization, larger repositories indexing limits, and faster AI summaries processing.
          </p>
        </div>

        {/* Plan status card */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Current plan details */}
          <div className="rounded-3xl border border-zinc-850 bg-zinc-950/40 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Your current plan</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {subscription.isPro ? "Pro Subscription" : "Free Tier Plan"}
                </span>
                <span className="text-xs text-zinc-450 font-mono">
                  {subscription.isPro ? "$9.00/mo" : "$0.00/mo"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-5">
                {subscription.isPro
                  ? `Your Pro subscription automatically renews on ${formattedPeriodEnd ?? "next period"}.`
                  : "You are currently exploring CodeMemory on the Free limits plan."}
              </p>
            </div>

            <button
              onClick={() => void handleBillingAction()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-zinc-950 py-3 text-xs font-semibold hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
              ) : subscription.isPro ? (
                <>
                  Manage billing portal
                  <ArrowUpRight className="h-4 w-4" />
                </>
              ) : (
                "Upgrade to Pro Plan"
              )}
            </button>
          </div>

          {/* Features Comparison list */}
          <div className="rounded-3xl border border-zinc-850 bg-zinc-950/20 p-6 space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Pro features included</span>
            <ul className="space-y-3">
              {[
                "Unlimited repository sync instances",
                "Advanced Cognee semantic graph parsing",
                "Priority Gemini-powered summaries",
                "Deep code dependency analysis",
                "Priority customer feedback channels",
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-xs text-zinc-300">
                  <CheckCircle className="h-4 w-4 shrink-0 text-[#BC9BFF]" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
