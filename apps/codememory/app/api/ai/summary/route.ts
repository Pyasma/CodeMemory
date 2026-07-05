import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { DEFAULT_SYSTEM_MESSAGE, generateGeminiReply } from "@/lib/gemini"

type SummaryRequestBody = {
  info?: string
  systemMessage?: string
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User isn't authenticated" },
        { status: 401 }
      )
    }

    const body = (await req.json()) as SummaryRequestBody
    const info = body.info?.trim()
    const systemMessage =
      body.systemMessage?.trim() || DEFAULT_SYSTEM_MESSAGE

    if (!info) {
      return NextResponse.json(
        { success: false, message: "info is required" },
        { status: 400 }
      )
    }

    const reply = await generateGeminiReply({
      info,
      systemMessage,
    })

    console.log("[ai/summary] raw reply:", reply)

    return NextResponse.json(
      {
        success: true,
        reply,
      },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate reply"

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    )
  }
}
