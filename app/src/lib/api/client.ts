/**
 * Base API Client for Next.js API Routes
 *
 * Provides a type-safe wrapper around fetch with:
 * - Automatic error handling
 * - JSON serialization
 * - Request/response logging
 * - Retry logic for network errors
 */

import { parseContractError, logError } from './errors'

/**
 * API request configuration
 */
interface ApiRequestConfig extends RequestInit {
  /** Query parameters to append to URL */
  params?: Record<string, string | number | boolean | undefined>
  /** Number of retry attempts for network errors */
  retries?: number
  /** Delay between retries (ms) */
  retryDelay?: number
}

/**
 * Standard API response format
 */
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, any>): string {
  if (!params) return endpoint

  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `${endpoint}?${queryString}` : endpoint
}

/**
 * Make API request with automatic retries and error handling
 */
async function request<T = any>(
  endpoint: string,
  config: ApiRequestConfig = {}
): Promise<T> {
  const {
    params,
    retries = 2,
    retryDelay = 1000,
    ...fetchConfig
  } = config

  const url = buildUrl(endpoint, params)
  let lastError: Error | null = null

  // Retry loop
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchConfig,
        headers: {
          'Content-Type': 'application/json',
          ...fetchConfig.headers,
        },
      })

      // Parse response
      const data: ApiResponse<T> = await response.json()

      // Handle API-level errors
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || `Request failed with status ${response.status}`)
      }

      // Return data
      return data.data as T
    } catch (error) {
      lastError = error as Error

      // Don't retry on client errors (4xx) - only retry network/server errors
      if (error instanceof Error) {
        const message = error.message.toLowerCase()
        const isNetworkError =
          message.includes('network') ||
          message.includes('fetch') ||
          message.includes('timeout') ||
          message.includes('econnrefused')

        // If it's not a network error or we're out of retries, throw
        if (!isNetworkError || attempt === retries) {
          break
        }

        // Wait before retry (exponential backoff)
        await sleep(retryDelay * Math.pow(2, attempt))
        continue
      }

      break
    }
  }

  // Log and throw error
  logError(lastError, { endpoint, config })
  throw parseContractError(lastError)
}

/**
 * API Client
 *
 * Centralized client for all API requests with proper error handling.
 *
 * Example usage:
 * ```tsx
 * // GET request
 * const invoices = await apiClient.get('/api/invoices', { params: { active: true } })
 *
 * // POST request
 * const result = await apiClient.post('/api/invoices', {
 *   body: { clientName: 'Acme Inc', amount: 1000 }
 * })
 * ```
 */
export const apiClient = {
  /**
   * GET request
   */
  get: <T = any>(endpoint: string, config?: ApiRequestConfig): Promise<T> => {
    return request<T>(endpoint, { ...config, method: 'GET' })
  },

  /**
   * POST request
   */
  post: <T = any>(
    endpoint: string,
    config?: ApiRequestConfig & { body?: any }
  ): Promise<T> => {
    return request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: config?.body ? JSON.stringify(config.body) : undefined,
    })
  },

  /**
   * PUT request
   */
  put: <T = any>(
    endpoint: string,
    config?: ApiRequestConfig & { body?: any }
  ): Promise<T> => {
    return request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: config?.body ? JSON.stringify(config.body) : undefined,
    })
  },

  /**
   * DELETE request
   */
  delete: <T = any>(endpoint: string, config?: ApiRequestConfig): Promise<T> => {
    return request<T>(endpoint, { ...config, method: 'DELETE' })
  },
}

/**
 * Type-safe API endpoints
 * Add endpoints here as you create them
 */
export const apiEndpoints = {
  invoices: {
    list: '/api/invoices',
    detail: (id: string) => `/api/invoices/${id}`,
  },
  yield: {
    stats: '/api/yield',
    deposit: (tokenId: string) => `/api/yield/${tokenId}`,
  },
  agent: {
    status: '/api/agent/status',
    decisions: '/api/agent/decisions',
  },
} as const
