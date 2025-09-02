import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client'
import { LanguageProvider } from '@/lib/i18n/context'

// Test wrapper component with required providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>
    {children}
  </LanguageProvider>
)

// Mock the dependencies
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

jest.mock('@/utils/supabase-client', () => ({
  createClient: () => ({
    auth: {
      getUser: () => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: { id: 'test-user-id', full_name: 'Test Admin', email: 'admin@test.com', role: 'admin' },
            error: null
          })
        })
      })
    })
  })
}))

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      overview: {
        total_revenue: 50000,
        revenue_change: 15.2,
        total_orders: 125,
        orders_change: 8.5,
        total_vendors: 45,
        vendors_change: 12.1,
        total_products: 320,
        products_change: 5.3,
        avg_order_value: 400,
        aov_change: 3.2,
        conversion_rate: 2.8,
        conversion_change: 0.5
      },
      vendors: [
        {
          id: '1',
          business_name: 'Test Vendor 1',
          email: 'vendor1@test.com',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          total_sales: 15000,
          product_count: 25,
          order_count: 30
        }
      ],
      recentOrders: [
        {
          id: '1',
          order_number: 'ORD-001',
          customer_name: 'John Doe',
          vendor_name: 'Test Vendor',
          total: 299.99,
          status: 'delivered',
          created_at: '2024-01-01T00:00:00Z',
          items_count: 2
        }
      ],
      pendingApprovals: [
        {
          id: '1',
          business_name: 'Pending Vendor',
          email: 'pending@test.com',
          created_at: '2024-01-01T00:00:00Z',
          type: 'vendor'
        }
      ],
      systemHealth: {
        uptime: '99.9%',
        active_sessions: 42,
        error_rate: 0.1,
        avg_response_time: 85
      }
    })
  })
) as jest.Mock

describe('AdminDashboardClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('shows loading skeleton initially', () => {
    render(<AdminDashboardClient />, { wrapper: TestWrapper })
    
    // Check for loading skeleton
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  test('displays dashboard data after loading', async () => {
    const mockAnalytics = {
      platform_revenue: 50000,
      platform_revenue_change: 15.2,
      total_orders: 1234,
      total_orders_change: 8.5,
      active_vendors: 56,
      active_vendors_change: 12.3,
      total_users: 9876,
      total_users_change: 5.7,
      avg_order_value: 125.50,
      avg_order_value_change: -2.1,
      commission_revenue: 2500,
      commission_revenue_change: 18.9
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalytics,
    })

    render(<AdminDashboardClient />, { wrapper: TestWrapper })
    
    // Wait for data to load - use more flexible text matching
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return content.includes('Welcome back') && element?.tagName === 'H1'
      })).toBeInTheDocument()
    })

    // Check if analytics data is displayed
    await waitFor(() => {
      expect(screen.getByText('$50,000.00')).toBeInTheDocument()
      expect(screen.getByText('1,234')).toBeInTheDocument()
      expect(screen.getByText('56')).toBeInTheDocument()
    })
  })

  test('handles period selection correctly', async () => {
    render(<AdminDashboardClient />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return content.includes('Welcome back') && element?.tagName === 'H1'
      })).toBeInTheDocument()
    })

    // Click on 7 days period
    const sevenDaysButton = screen.getByText('7 days')
    fireEvent.click(sevenDaysButton)

    // Verify API call with correct period
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/analytics?period=7d')
    )
  })

  test('displays pending approvals alert when available', async () => {
    render(<AdminDashboardClient />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('You have 1 pending approval(s) requiring your attention.')).toBeInTheDocument()
    })
  })

  test('shows system health metrics', async () => {
    render(<AdminDashboardClient />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return content.includes('Welcome back') && element?.tagName === 'H1'
      })).toBeInTheDocument()
    })

    // Click on System Health tab
    const systemHealthTab = screen.getByText('System Health')
    fireEvent.click(systemHealthTab)

    // Check system health metrics
    await waitFor(() => {
      expect(screen.getByText('99.9%')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.getByText('0.10%')).toBeInTheDocument()
      expect(screen.getByText('85ms')).toBeInTheDocument()
    })
  })

  test('handles vendor approval action', async () => {
    const mockFetch = fetch as jest.Mock
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    )

    render(<AdminDashboardClient />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return content.includes('Welcome back') && element?.tagName === 'H1'
      })).toBeInTheDocument()
    })

    // Click on Pending Approvals tab
    const approvalsTab = screen.getByText('Pending Approvals')
    fireEvent.click(approvalsTab)

    // Click approve button
    const approveButton = screen.getByText('Approve')
    fireEvent.click(approveButton)

    // Verify approval API call
    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/vendors/1/approve',
      expect.objectContaining({
        method: 'POST'
      })
    )
  })

  test('switches between tabs correctly', async () => {
    render(<AdminDashboardClient />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return content.includes('Welcome back') && element?.tagName === 'H1'
      })).toBeInTheDocument()
    })

    // Test tab switching
    const vendorsTab = screen.getByText('Vendors')
    fireEvent.click(vendorsTab)
    expect(screen.getByText('Vendor Management')).toBeInTheDocument()

    const ordersTab = screen.getByText('Recent Orders')
    fireEvent.click(ordersTab)
    expect(screen.getByText('All Orders')).toBeInTheDocument()
  })

  test('handles error states gracefully', async () => {
    const mockFetch = fetch as jest.Mock
    mockFetch.mockRejectedValueOnce(new Error('API Error'))

    render(<AdminDashboardClient />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.getByText('Unable to load admin dashboard data. Please refresh the page.')).toBeInTheDocument()
    })
  })
})
