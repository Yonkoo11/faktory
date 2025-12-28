// QuickBooks API integration utilities
// Uses OAuth 2.0 for authentication

const QUICKBOOKS_BASE_URL = process.env.QUICKBOOKS_ENVIRONMENT === "production"
  ? "https://quickbooks.api.intuit.com"
  : "https://sandbox-quickbooks.api.intuit.com"

const OAUTH_BASE_URL = "https://appcenter.intuit.com/connect/oauth2"

// OAuth endpoints
export const QUICKBOOKS_AUTH_URL = `${OAUTH_BASE_URL}/v1/tokens/bearer`
export const QUICKBOOKS_AUTHORIZE_URL = "https://appcenter.intuit.com/connect/oauth2"

// Scopes required for invoice access
export const QUICKBOOKS_SCOPES = [
  "com.intuit.quickbooks.accounting",
].join(" ")

export interface QuickBooksTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
  realmId: string
  expiresAt: number
}

export interface QuickBooksInvoice {
  Id: string
  DocNumber: string
  CustomerRef: {
    value: string
    name: string
  }
  TotalAmt: number
  Balance: number
  DueDate: string
  TxnDate: string
  EmailStatus: string
  BillEmail?: {
    Address: string
  }
  Line: Array<{
    Description: string
    Amount: number
    DetailType: string
    SalesItemLineDetail?: {
      ItemRef: {
        value: string
        name: string
      }
      Qty: number
      UnitPrice: number
    }
  }>
}

// Generate OAuth authorization URL
export function getAuthorizationUrl(state: string): string {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI

  if (!clientId || !redirectUri) {
    throw new Error("QuickBooks OAuth configuration missing")
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: QUICKBOOKS_SCOPES,
    state,
  })

  return `${QUICKBOOKS_AUTHORIZE_URL}?${params.toString()}`
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  code: string,
  realmId: string
): Promise<QuickBooksTokens> {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("QuickBooks OAuth configuration missing")
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await fetch(QUICKBOOKS_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
    realmId,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

// Refresh access token
export async function refreshAccessToken(
  refreshToken: string
): Promise<QuickBooksTokens> {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("QuickBooks OAuth configuration missing")
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await fetch(QUICKBOOKS_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token refresh failed: ${error}`)
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
    realmId: "", // Will need to be preserved from original token
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

// Fetch invoices from QuickBooks
export async function fetchInvoices(
  accessToken: string,
  realmId: string,
  options?: {
    status?: "open" | "paid" | "all"
    limit?: number
  }
): Promise<QuickBooksInvoice[]> {
  const { status = "open", limit = 100 } = options || {}

  // Build query
  let query = `SELECT * FROM Invoice`

  if (status === "open") {
    query += ` WHERE Balance > 0`
  } else if (status === "paid") {
    query += ` WHERE Balance = 0`
  }

  query += ` MAXRESULTS ${limit}`

  const encodedQuery = encodeURIComponent(query)
  const url = `${QUICKBOOKS_BASE_URL}/v3/company/${realmId}/query?query=${encodedQuery}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch invoices: ${error}`)
  }

  const data = await response.json()
  return data.QueryResponse?.Invoice || []
}

// Fetch a single invoice by ID
export async function fetchInvoice(
  accessToken: string,
  realmId: string,
  invoiceId: string
): Promise<QuickBooksInvoice | null> {
  const url = `${QUICKBOOKS_BASE_URL}/v3/company/${realmId}/invoice/${invoiceId}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    const error = await response.text()
    throw new Error(`Failed to fetch invoice: ${error}`)
  }

  const data = await response.json()
  return data.Invoice || null
}

// Create commitment hash from invoice data
export function createInvoiceCommitmentData(invoice: QuickBooksInvoice): string {
  // Create a deterministic string from invoice data
  return JSON.stringify({
    id: invoice.Id,
    docNumber: invoice.DocNumber,
    customer: invoice.CustomerRef.name,
    amount: invoice.TotalAmt,
    dueDate: invoice.DueDate,
    txnDate: invoice.TxnDate,
  })
}

// Format invoice for frontend display
export function formatInvoiceForDisplay(invoice: QuickBooksInvoice) {
  return {
    id: invoice.Id,
    docNumber: invoice.DocNumber,
    customerName: invoice.CustomerRef.name,
    customerId: invoice.CustomerRef.value,
    amount: invoice.TotalAmt,
    balance: invoice.Balance,
    dueDate: invoice.DueDate,
    txnDate: invoice.TxnDate,
    isPaid: invoice.Balance === 0,
    email: invoice.BillEmail?.Address,
    lineItems: invoice.Line.filter((l) => l.DetailType === "SalesItemLineDetail").map((l) => ({
      description: l.Description,
      amount: l.Amount,
      quantity: l.SalesItemLineDetail?.Qty,
      unitPrice: l.SalesItemLineDetail?.UnitPrice,
    })),
  }
}

// Simple in-memory token storage (for demo - use database in production)
const tokenStore = new Map<string, QuickBooksTokens>()

export function storeTokens(userId: string, tokens: QuickBooksTokens) {
  tokenStore.set(userId, tokens)
}

export function getStoredTokens(userId: string): QuickBooksTokens | undefined {
  return tokenStore.get(userId)
}

export function clearTokens(userId: string) {
  tokenStore.delete(userId)
}
