import React from 'react'
import { render, screen } from '@testing-library/react'
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client'
import { LanguageProvider } from '@/lib/i18n/context'
import { Toaster } from '@/components/ui/toaster'

// Simple test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>
    {children}
    <Toaster />
  </LanguageProvider>
)

// Mock Supabase client
jest.mock('@/utils/supabase-client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null }))
    }
  }))
}))

// Mock authenticated fetch
jest.mock('@/lib/api-client', () => ({
  authenticatedFetch: jest.fn(() => Promise.reject(new Error('API not available in test')))
}))

describe('AdminDashboardClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders loading state initially', () => {
    render(<AdminDashboardClient />, { wrapper: TestWrapper })
    
    // Check for loading skeleton
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  test('renders without crashing', () => {
    render(<AdminDashboardClient />, { wrapper: TestWrapper })
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })
})
