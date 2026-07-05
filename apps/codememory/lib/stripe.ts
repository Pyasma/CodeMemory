import Stripe from "stripe"

const apiKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key_for_build"

export const stripe = new Stripe(apiKey, {
  apiVersion: "2023-10-16" as any,
  typescript: true,
})
