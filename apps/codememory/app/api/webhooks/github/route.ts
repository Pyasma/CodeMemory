import { prisma } from "@/db/prisma"
import { syncRepository } from "@/lib/sync-repo"
import { NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    let body
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload" },
        { status: 400 }
      )
    }

    // Optional verification signature check if GITHUB_WEBHOOK_SECRET is set
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = req.headers.get("x-hub-signature-256")
      if (!signature) {
        return NextResponse.json(
          { success: false, message: "Missing signature header" },
          { status: 401 }
        )
      }

      const hmac = createHmac("sha256", webhookSecret)
      const digest = "sha256=" + hmac.update(rawBody).digest("hex")

      const sigBuffer = Buffer.from(signature)
      const digestBuffer = Buffer.from(digest)

      if (sigBuffer.length !== digestBuffer.length || !timingSafeEqual(sigBuffer, digestBuffer)) {
        return NextResponse.json(
          { success: false, message: "Signature verification failed" },
          { status: 401 }
        )
      }
    }

    // GitHub webhook push event
    const event = req.headers.get("x-github-event")
    
    // We only care about push events or ping requests
    if (event === "ping") {
      return NextResponse.json({ success: true, message: "pong" }, { status: 200 })
    }

    if (event !== "push") {
      return NextResponse.json(
        { success: true, message: `Ignoring event type: ${event}` },
        { status: 200 }
      )
    }

    const githubUrl = body.repository?.html_url
    if (!githubUrl) {
      return NextResponse.json(
        { success: false, message: "Missing repository html_url in payload" },
        { status: 400 }
      )
    }

    // Find all database repo records matching this github url
    const repos = await prisma.repo.findMany({
      where: {
        githubUrl: {
          equals: githubUrl,
          mode: "insensitive", // case-insensitive matching
        },
      },
    })

    if (repos.length === 0) {
      return NextResponse.json(
        { success: true, message: "No matching repository found in database to sync" },
        { status: 200 }
      )
    }

    console.log(`[GitHub Webhook] Syncing ${repos.length} matching repository records...`)

    // Sync all matching repos
    const syncPromises = repos.map(async (repo) => {
      try {
        await syncRepository(repo.id)
        console.log(`[GitHub Webhook] Successfully synced repository: ${repo.owner}/${repo.name}`)
      } catch (err) {
        console.error(`[GitHub Webhook] Failed to sync repository: ${repo.owner}/${repo.name}:`, err)
      }
    })

    await Promise.all(syncPromises)

    return NextResponse.json(
      {
        success: true,
        message: "Successfully synced matched repository records",
        syncedCount: repos.length,
      },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "GitHub Webhook handler failed"
    console.error("[GitHub Webhook Error]:", message)
    
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}
