import { stripe } from "@/lib/stripe"
import { prisma } from "@/db/prisma"
import { NextResponse } from "next/server"
import type Stripe from "stripe"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature") ?? ""

  let event: Stripe.Event

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.warn("[Stripe Webhook] STRIPE_WEBHOOK_SECRET missing. Skipping constructEvent check.")
      return NextResponse.json({ success: true, message: "Webhook secret missing, event skipped" }, { status: 200 })
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed"
    console.error(`[Stripe Webhook Error]: ${message}`)
    return NextResponse.json({ success: false, message }, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session

  try {
    if (event.type === "checkout.session.completed") {
      const subscription = (await stripe.subscriptions.retrieve(
        session.subscription as string
      )) as any

      if (!session.metadata?.userId) {
        throw new Error("Missing userId in session metadata")
      }

      await prisma.user.update({
        where: {
          id: Number(session.metadata.userId),
        },
        data: {
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
        },
      })
    }

    if (event.type === "invoice.payment_succeeded") {
      const subscription = (await stripe.subscriptions.retrieve(
        session.subscription as string
      )) as any

      await prisma.user.update({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
        },
      })
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription

      await prisma.user.update({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          stripePriceId: null,
          stripeSubscriptionId: null,
          stripeCurrentPeriodEnd: null,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed"
    console.error(`[Stripe Webhook Handler Error]: ${message}`)
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

