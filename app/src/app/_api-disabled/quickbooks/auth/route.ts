import { NextRequest, NextResponse } from "next/server"
import { getAuthorizationUrl } from "@/lib/quickbooks"
import { randomBytes } from "crypto"

export async function GET(request: NextRequest) {
  try {
    // Generate a random state for CSRF protection
    const state = randomBytes(16).toString("hex")

    // Store state in a cookie for verification on callback
    const authUrl = getAuthorizationUrl(state)

    const response = NextResponse.redirect(authUrl)

    // Set state cookie for verification
    response.cookies.set("qb_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    })

    return response
  } catch (error) {
    console.error("QuickBooks auth error:", error)

    // Redirect back to mint page with error
    const errorUrl = new URL("/dashboard/mint", request.url)
    errorUrl.searchParams.set("error", "quickbooks_auth_failed")
    return NextResponse.redirect(errorUrl)
  }
}
