import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/db/prisma"
import { stripe } from "@/lib/stripe"
import { getOrCreateDbUser } from "@/lib/fetch-projects"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User isn't authenticated" },
        { status: 401 }
      )
    }

    const user = await getOrCreateDbUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found in database" },
        { status: 404 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    // If Stripe keys are not set, run in fallback simulated developer mode!
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn("[Stripe Checkout] STRIPE_SECRET_KEY missing. Simulating instant upgrade for dev testing.")
      
      // Simulate upgrade by marking the user as active Pro in database directly
      const mockPeriodEnd = new Date()
      mockPeriodEnd.setDate(mockPeriodEnd.getDate() + 30) // 30 days trial

      await prisma.user.update({
        where: { id: user.id },
        data: {
          stripePriceId: "mock_price_pro_plan",
          stripeSubscriptionId: `mock_sub_${Math.random().toString(36).substring(7)}`,
          stripeCurrentPeriodEnd: mockPeriodEnd,
        },
      })

      return NextResponse.json({
        success: true,
        url: `${appUrl}/welcome/billing?success=true`,
      })
    }

    const isSubscribed =
      user.stripePriceId &&
      user.stripeCurrentPeriodEnd &&
      user.stripeCurrentPeriodEnd.getTime() + 86_400_000 > Date.now()

    // If already subscribed, return Customer Portal URL to manage subscription
    if (isSubscribed && user.stripeCustomerId && user.stripeSubscriptionId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${appUrl}/welcome/billing`,
      })

      return NextResponse.json({
        success: true,
        url: portalSession.url,
      })
    }

    // Otherwise, create checkout session
    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || undefined,
        metadata: {
          userId: user.id.toString(),
          clerkId: user.clerkId,
        },
      })

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      })

      customerId = customer.id
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID
    if (!priceId) {
      return NextResponse.json(
        { success: false, message: "STRIPE_PRO_PRICE_ID configuration is missing" },
        { status: 500 }
      )
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}/welcome/billing?success=true`,
      cancel_url: `${appUrl}/welcome/billing?canceled=true`,
      metadata: {
        userId: user.id.toString(),
      },
    })

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout error"
    console.error("[Checkout Route API Error]:", message)
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
