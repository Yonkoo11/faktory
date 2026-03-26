import { NextRequest, NextResponse } from "next/server"
import {
  getTotalInvoices,
  getActiveInvoices,
  getFormattedInvoice,
  getUserInvoiceBalance,
} from "@/lib/contracts/server"
import { type Address } from "viem"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get("address") as Address | null
    const activeOnly = searchParams.get("active") === "true"

    // Get total count
    const totalCount = await getTotalInvoices()

    // If requesting for a specific address
    if (address) {
      const balance = await getUserInvoiceBalance(address)
      // Note: To get specific user invoices, we'd need to iterate through
      // tokenOfOwnerByIndex - for now return the balance
      return NextResponse.json({
        success: true,
        data: {
          address,
          balance,
          totalInvoices: totalCount,
        },
      })
    }

    // Get active invoices if requested
    if (activeOnly) {
      const activeIds = await getActiveInvoices()
      const invoices = await Promise.all(
        activeIds.slice(0, 50).map((id) => getFormattedInvoice(id))
      )

      return NextResponse.json({
        success: true,
        data: {
          invoices: invoices.filter(Boolean),
          total: activeIds.length,
          totalInvoices: totalCount,
        },
      })
    }

    // Return summary
    const activeIds = await getActiveInvoices()

    return NextResponse.json({
      success: true,
      data: {
        totalInvoices: totalCount,
        activeCount: activeIds.length,
      },
    })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch invoices",
      },
      { status: 500 }
    )
  }
}
