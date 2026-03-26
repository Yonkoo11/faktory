import { NextRequest, NextResponse } from "next/server"
import {
  getStoredTokens,
  fetchInvoices,
  fetchInvoice,
  formatInvoiceForDisplay,
  refreshAccessToken,
  storeTokens,
} from "@/lib/quickbooks"

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const sessionId = request.cookies.get("qb_session")?.value

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Not connected to QuickBooks",
          requiresAuth: true,
        },
        { status: 401 }
      )
    }

    // Get stored tokens
    let tokens = getStoredTokens(sessionId)

    if (!tokens) {
      return NextResponse.json(
        {
          success: false,
          error: "QuickBooks session expired",
          requiresAuth: true,
        },
        { status: 401 }
      )
    }

    // Check if token needs refresh
    if (tokens.expiresAt < Date.now() + 60000) {
      // Less than 1 minute left
      try {
        const newTokens = await refreshAccessToken(tokens.refreshToken)
        newTokens.realmId = tokens.realmId
        storeTokens(sessionId, newTokens)
        tokens = newTokens
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to refresh QuickBooks token",
            requiresAuth: true,
          },
          { status: 401 }
        )
      }
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const invoiceId = searchParams.get("id")
    const status = (searchParams.get("status") || "open") as "open" | "paid" | "all"

    // Fetch single invoice if ID provided
    if (invoiceId) {
      const invoice = await fetchInvoice(
        tokens.accessToken,
        tokens.realmId,
        invoiceId
      )

      if (!invoice) {
        return NextResponse.json(
          {
            success: false,
            error: "Invoice not found",
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: formatInvoiceForDisplay(invoice),
      })
    }

    // Fetch all invoices
    const invoices = await fetchInvoices(tokens.accessToken, tokens.realmId, {
      status,
      limit: 100,
    })

    return NextResponse.json({
      success: true,
      data: {
        invoices: invoices.map(formatInvoiceForDisplay),
        total: invoices.length,
        status,
      },
    })
  } catch (error) {
    console.error("QuickBooks invoices error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch QuickBooks invoices",
      },
      { status: 500 }
    )
  }
}
