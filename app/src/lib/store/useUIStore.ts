import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

/**
 * Modal identifiers in the application
 */
export type ModalType =
  | 'deposit'
  | 'withdraw'
  | 'mint'
  | 'agentSettings'
  | 'keyboardShortcuts'
  | null

/**
 * Invoice filter options
 */
export interface InvoiceFilters {
  status?: 'all' | 'active' | 'hold' | 'deposited'
  sortBy?: 'amount' | 'dueDate' | 'yield' | 'risk'
  sortOrder?: 'asc' | 'desc'
  searchQuery?: string
}

/**
 * User preferences
 */
export interface UserPreferences {
  /** Show transaction notifications */
  showNotifications: boolean

  /** Auto-refresh data interval (in seconds, 0 = disabled) */
  autoRefreshInterval: number

  /** Show advanced features (risk analysis, APY calculator, etc.) */
  showAdvancedFeatures: boolean

  /** Preferred chart period */
  defaultChartPeriod: '7d' | '30d' | '90d' | '1y' | 'all'
}

/**
 * UI Store State
 */
interface UIStore {
  /** Currently open modal (only one modal can be open at a time) */
  openModal: ModalType

  /** Context data for the open modal (e.g., tokenId for deposit modal) */
  modalContext: Record<string, any>

  /** Invoice table filters */
  invoiceFilters: InvoiceFilters

  /** Mobile menu open/closed state */
  isMobileMenuOpen: boolean

  /** User preferences (persisted to localStorage) */
  preferences: UserPreferences

  /** Open a modal with optional context */
  setOpenModal: (modal: ModalType, context?: Record<string, any>) => void

  /** Close the current modal */
  closeModal: () => void

  /** Update invoice filters */
  setInvoiceFilters: (filters: Partial<InvoiceFilters>) => void

  /** Reset invoice filters to default */
  resetInvoiceFilters: () => void

  /** Toggle mobile menu */
  toggleMobileMenu: () => void

  /** Close mobile menu */
  closeMobileMenu: () => void

  /** Update user preferences */
  updatePreferences: (preferences: Partial<UserPreferences>) => void

  /** Reset preferences to defaults */
  resetPreferences: () => void
}

/**
 * Default user preferences
 */
const defaultPreferences: UserPreferences = {
  showNotifications: true,
  autoRefreshInterval: 30, // 30 seconds
  showAdvancedFeatures: false,
  defaultChartPeriod: '30d',
}

/**
 * Default invoice filters
 */
const defaultFilters: InvoiceFilters = {
  status: 'all',
  sortBy: 'dueDate',
  sortOrder: 'asc',
  searchQuery: '',
}

/**
 * Global UI State Store
 *
 * Manages all client-side UI state including modals, filters, and user preferences.
 * User preferences are persisted to localStorage for consistent experience.
 *
 * Features:
 * - Modal management (only one modal open at a time)
 * - Invoice filtering and sorting
 * - Mobile menu state
 * - Persistent user preferences
 * - Type-safe state updates via Immer
 *
 * Example usage:
 * ```tsx
 * const { setOpenModal, closeModal, openModal } = useUIStore()
 *
 * // Open deposit modal for specific invoice
 * <Button onClick={() => setOpenModal('deposit', { tokenId: '42' })}>
 *   Deposit
 * </Button>
 *
 * // In modal component
 * const { modalContext } = useUIStore()
 * const tokenId = modalContext.tokenId
 * ```
 */
export const useUIStore = create<UIStore>()(
  persist(
    immer((set) => ({
      openModal: null,
      modalContext: {},
      invoiceFilters: defaultFilters,
      isMobileMenuOpen: false,
      preferences: defaultPreferences,

      setOpenModal: (modal, context = {}) =>
        set((state) => {
          state.openModal = modal
          state.modalContext = context
        }),

      closeModal: () =>
        set((state) => {
          state.openModal = null
          state.modalContext = {}
        }),

      setInvoiceFilters: (filters) =>
        set((state) => {
          state.invoiceFilters = { ...state.invoiceFilters, ...filters }
        }),

      resetInvoiceFilters: () =>
        set((state) => {
          state.invoiceFilters = defaultFilters
        }),

      toggleMobileMenu: () =>
        set((state) => {
          state.isMobileMenuOpen = !state.isMobileMenuOpen
        }),

      closeMobileMenu: () =>
        set((state) => {
          state.isMobileMenuOpen = false
        }),

      updatePreferences: (newPreferences) =>
        set((state) => {
          state.preferences = { ...state.preferences, ...newPreferences }
        }),

      resetPreferences: () =>
        set((state) => {
          state.preferences = defaultPreferences
        }),
    })),
    {
      name: 'faktory-ui-storage',
      // Only persist preferences (not modal state or filters)
      partialize: (state) => ({ preferences: state.preferences }),
    }
  )
)

/**
 * Hook to check if a specific modal is open
 */
export const useIsModalOpen = (modal: Exclude<ModalType, null>) => {
  return useUIStore((state) => state.openModal === modal)
}

/**
 * Hook to get mobile menu state
 */
export const useIsMobileMenuOpen = () => {
  return useUIStore((state) => state.isMobileMenuOpen)
}

/**
 * Hook to get specific preference
 */
export const usePreference = <K extends keyof UserPreferences>(
  key: K
): UserPreferences[K] => {
  return useUIStore((state) => state.preferences[key])
}
