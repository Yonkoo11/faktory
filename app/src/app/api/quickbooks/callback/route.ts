import { NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens, storeTokens } from "@/lib/quickbooks"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const realmId = searchParams.get("realmId")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    // Check for OAuth errors
    if (error) {
      console.error("QuickBooks OAuth error:", error)
      const errorUrl = new URL("/dashboard/mint", request.url)
      errorUrl.searchParams.set("error", "quickbooks_denied")
      return NextResponse.redirect(errorUrl)
    }

    // Validate required params
    if (!code || !realmId) {
      const errorUrl = new URL("/dashboard/mint", request.url)
      errorUrl.searchParams.set("error", "missing_params")
      return NextResponse.redirect(errorUrl)
    }

    // Verify state to prevent CSRF
    const storedState = request.cookies.get("qb_oauth_state")?.value
    if (!storedState || storedState !== state) {
      const errorUrl = new URL("/dashboard/mint", request.url)
      errorUrl.searchParams.set("error", "invalid_state")
      return NextResponse.redirect(errorUrl)
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, realmId)

    // For demo, we'll use a simple session identifier
    // In production, link to authenticated user
    const sessionId = crypto.randomUUID()
    storeTokens(sessionId, tokens)

    // Redirect to mint page with success
    const successUrl = new URL("/dashboard/mint", request.url)
    successUrl.searchParams.set("quickbooks", "connected")

    const response = NextResponse.redirect(successUrl)

    // Set session cookie
    response.cookies.set("qb_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour
    })

    // Clear state cookie
    response.cookies.delete("qb_oauth_state")

    return response
  } catch (error) {
    console.error("QuickBooks callback error:", error)
    const errorUrl = new URL("/dashboard/mint", request.url)
    errorUrl.searchParams.set("error", "token_exchange_failed")
    return NextResponse.redirect(errorUrl)
  }
}
