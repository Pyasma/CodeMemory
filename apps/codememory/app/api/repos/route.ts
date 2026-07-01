import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {

    const { isAuthenticated } = await auth()
    
    if (!isAuthenticated) {
        return NextResponse.json({success: false, message: "User isn't Authenticated"}, {status: 401})
    }

    const user = await currentUser()

    console.log(user?.externalAccounts)

    return NextResponse.json({success: true, message: "Correctly Fetched"}, {status: 200})
}