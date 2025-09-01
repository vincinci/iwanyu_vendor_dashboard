import { test, expect, Page } from '@playwright/test'

class DashboardPage {
  constructor(private page: Page) {}

  async navigateToAdmin() {
    await this.page.goto('/admin')
  }

  async navigateToVendor() {
    await this.page.goto('/vendor')
  }

  async login(email: string, password: string) {
    await this.page.goto('/auth/login')
    await this.page.fill('input[name="email"]', email)
    await this.page.fill('input[name="password"]', password)
    await this.page.click('button[type="submit"]')
    await this.page.waitForURL(/\/(admin|vendor)/)
  }

  async getMetricValue(metricName: string) {
    const metric = this.page.locator(`text=${metricName}`).locator('..').locator('div').nth(1)
    return await metric.textContent()
  }

  async switchPeriod(period: '7 days' | '30 days' | '90 days') {
    await this.page.click(`button:has-text("${period}")`)
  }

  async switchTab(tabName: string) {
    await this.page.click(`[role="tab"]:has-text("${tabName}")`)
  }

  async approveVendor(vendorName: string) {
    await this.switchTab('Pending Approvals')
    await this.page.click(`text=${vendorName} >> .. >> button:has-text("Approve")`)
  }
}

test.describe('Iwanyu Dashboard - Full Platform Tests', () => {
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page)
  })

  test.describe('Admin Dashboard', () => {
    test('admin can view comprehensive analytics dashboard', async ({ page }) => {
      await dashboardPage.login('admin@iwanyu.com', 'admin123')
      await dashboardPage.navigateToAdmin()

      // Check that main metrics are visible
      await expect(page.locator('text=Platform Revenue')).toBeVisible()
      await expect(page.locator('text=Total Orders')).toBeVisible()
      await expect(page.locator('text=Active Vendors')).toBeVisible()
      await expect(page.locator('text=Total Products')).toBeVisible()

      // Verify dashboard loads with data
      const revenue = await dashboardPage.getMetricValue('Platform Revenue')
      expect(revenue).toMatch(/\$[\d,]+\.?\d*/)
    })

    test('admin can switch time periods and see updated data', async ({ page }) => {
      await dashboardPage.login('admin@iwanyu.com', 'admin123')
      await dashboardPage.navigateToAdmin()

      // Switch to 7 days period
      await dashboardPage.switchPeriod('7 days')
      
      // Verify the period button is active
      await expect(page.locator('button:has-text("7 days")').locator('..')).toHaveClass(/bg-primary/)
      
      // Switch to 90 days
      await dashboardPage.switchPeriod('90 days')
      await expect(page.locator('button:has-text("90 days")').locator('..')).toHaveClass(/bg-primary/)
    })

    test('admin can navigate between dashboard tabs', async ({ page }) => {
      await dashboardPage.login('admin@iwanyu.com', 'admin123')
      await dashboardPage.navigateToAdmin()

      // Test Vendors tab
      await dashboardPage.switchTab('Vendors')
      await expect(page.locator('text=Vendor Management')).toBeVisible()

      // Test Orders tab
      await dashboardPage.switchTab('Recent Orders')
      await expect(page.locator('text=All Orders')).toBeVisible()

      // Test System Health tab
      await dashboardPage.switchTab('System Health')
      await expect(page.locator('text=System Uptime')).toBeVisible()
      await expect(page.locator('text=Active Sessions')).toBeVisible()
    })

    test('admin can view and manage pending vendor approvals', async ({ page }) => {
      await dashboardPage.login('admin@iwanyu.com', 'admin123')
      await dashboardPage.navigateToAdmin()

      await dashboardPage.switchTab('Pending Approvals')
      
      // Check if there are pending approvals or empty state
      const hasPendingApprovals = await page.locator('text=Approve').isVisible()
      
      if (hasPendingApprovals) {
        // Test approval workflow
        await page.locator('button:has-text("Approve")').first().click()
        await expect(page.locator('text=Vendor approved successfully')).toBeVisible({ timeout: 5000 })
      } else {
        // Verify empty state message
        await expect(page.locator('text=All caught up! No pending approvals.')).toBeVisible()
      }
    })

    test('admin dashboard shows system health indicators', async ({ page }) => {
      await dashboardPage.login('admin@iwanyu.com', 'admin123')
      await dashboardPage.navigateToAdmin()

      await dashboardPage.switchTab('System Health')

      // Verify system health metrics
      await expect(page.locator('text=System Uptime')).toBeVisible()
      await expect(page.locator('text=Active Sessions')).toBeVisible()
      await expect(page.locator('text=Error Rate')).toBeVisible()
      await expect(page.locator('text=Response Time')).toBeVisible()

      // Check for health status badges
      await expect(page.locator('[class*="bg-green"]')).toBeVisible()
    })
  })

  test.describe('Vendor Dashboard', () => {
    test('vendor can view their business analytics', async ({ page }) => {
      await dashboardPage.login('vendor@iwanyu.com', 'vendor123')
      await dashboardPage.navigateToVendor()

      // Check vendor-specific metrics
      await expect(page.locator('text=Total Revenue')).toBeVisible()
      await expect(page.locator('text=Orders')).toBeVisible()
      await expect(page.locator('text=Products')).toBeVisible()
      await expect(page.locator('text=Avg. Order Value')).toBeVisible()

      // Verify welcome message
      await expect(page.locator('text=Welcome back')).toBeVisible()
    })

    test('vendor can manage their products and inventory', async ({ page }) => {
      await dashboardPage.login('vendor@iwanyu.com', 'vendor123')
      await dashboardPage.navigateToVendor()

      await dashboardPage.switchTab('Products')
      await expect(page.locator('text=Product Performance')).toBeVisible()

      // Check for product management features
      await dashboardPage.switchTab('Inventory')
      await expect(page.locator('text=Inventory Status')).toBeVisible()
    })

    test('vendor receives low stock alerts', async ({ page }) => {
      await dashboardPage.login('vendor@iwanyu.com', 'vendor123')
      await dashboardPage.navigateToVendor()

      // Check for low stock alerts if they exist
      const hasLowStockAlert = await page.locator('text=low stock').isVisible()
      
      if (hasLowStockAlert) {
        await expect(page.locator('[class*="alert"]')).toBeVisible()
        await expect(page.locator('text=View Details')).toBeVisible()
      }
    })

    test('vendor can view recent orders', async ({ page }) => {
      await dashboardPage.login('vendor@iwanyu.com', 'vendor123')
      await dashboardPage.navigateToVendor()

      await dashboardPage.switchTab('Recent Orders')
      await expect(page.locator('text=All Orders')).toBeVisible()

      // Verify order management interface
      await expect(page.locator('text=View Details')).toBeVisible()
    })
  })

  test.describe('Authentication & Navigation', () => {
    test('login redirects to appropriate dashboard based on role', async ({ page }) => {
      // Test admin login
      await dashboardPage.login('admin@iwanyu.com', 'admin123')
      await expect(page).toHaveURL(/\/admin/)
      await expect(page.locator('text=Admin Dashboard')).toBeVisible()

      // Logout and test vendor login
      await page.click('button[aria-label="User menu"]')
      await page.click('text=Logout')
      
      await dashboardPage.login('vendor@iwanyu.com', 'vendor123')
      await expect(page).toHaveURL(/\/vendor/)
    })

    test('unauthenticated users are redirected to login', async ({ page }) => {
      await page.goto('/admin')
      await expect(page).toHaveURL(/\/auth\/login/)

      await page.goto('/vendor')
      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('role-based access control works correctly', async ({ page }) => {
      // Vendor trying to access admin dashboard
      await dashboardPage.login('vendor@iwanyu.com', 'vendor123')
      await page.goto('/admin')
      
      // Should be redirected or show access denied
      const isAccessDenied = await page.locator('text=Access denied').isVisible()
      const isRedirectedToVendor = page.url().includes('/vendor')
      expect(isAccessDenied || isRedirectedToVendor).toBeTruthy()
    })
  })

  test.describe('Responsive Design', () => {
    test('dashboard works on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      await dashboardPage.login('admin@iwanyu.com', 'admin123')
      await dashboardPage.navigateToAdmin()

      // Check that mobile layout is properly displayed
      await expect(page.locator('text=Platform Revenue')).toBeVisible()
      
      // Test mobile navigation
      const mobileMenu = page.locator('[aria-label="Mobile menu"]')
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click()
        await expect(page.locator('text=Dashboard')).toBeVisible()
      }
    })

    test('dashboard works on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      
      await dashboardPage.login('vendor@iwanyu.com', 'vendor123')
      await dashboardPage.navigateToVendor()

      // Verify responsive grid layout
      await expect(page.locator('text=Total Revenue')).toBeVisible()
      
      // Check that tabs are accessible
      await dashboardPage.switchTab('Products')
      await expect(page.locator('text=Product Performance')).toBeVisible()
    })
  })

  test.describe('Performance & Error Handling', () => {
    test('dashboard loads within acceptable time limits', async ({ page }) => {
      const startTime = Date.now()
      
      await dashboardPage.login('admin@iwanyu.com', 'admin123')
      await dashboardPage.navigateToAdmin()
      
      await expect(page.locator('text=Platform Revenue')).toBeVisible()
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(5000) // 5 seconds max
    })

    test('dashboard handles API errors gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/admin/analytics**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        })
      })

      await dashboardPage.login('admin@iwanyu.com', 'admin123')
      await dashboardPage.navigateToAdmin()

      // Should show error state
      await expect(page.locator('text=Unable to load')).toBeVisible({ timeout: 10000 })
    })

    test('dashboard shows loading states appropriately', async ({ page }) => {
      // Slow down network to see loading states
      await page.route('**/api/**', route => {
        setTimeout(() => route.continue(), 1000)
      })

      await dashboardPage.login('admin@iwanyu.com', 'admin123')
      await dashboardPage.navigateToAdmin()

      // Should show loading skeleton
      await expect(page.locator('[class*="animate-pulse"]')).toBeVisible()
      
      // Should eventually load data
      await expect(page.locator('text=Platform Revenue')).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('Data Accuracy & Real-time Updates', () => {
    test('metrics update when time period changes', async ({ page }) => {
      await dashboardPage.login('admin@iwanyu.com', 'admin123')
      await dashboardPage.navigateToAdmin()

      // Get initial revenue value
      const initialRevenue = await dashboardPage.getMetricValue('Platform Revenue')
      
      // Switch period and check if value changes (or at least API is called)
      await dashboardPage.switchPeriod('7 days')
      
      // Wait for potential update
      await page.waitForTimeout(2000)
      
      // Verify API call was made with correct period
      const requests: string[] = []
      page.on('request', request => {
        if (request.url().includes('/api/admin/analytics')) {
          requests.push(request.url())
        }
      })
      
      expect(requests.some(url => url.includes('period=7d'))).toBeTruthy()
    })

    test('real-time notifications work correctly', async ({ page }) => {
      await dashboardPage.login('admin@iwanyu.com', 'admin123')
      await dashboardPage.navigateToAdmin()

      // Check for notification bell
      const notificationBell = page.locator('[aria-label="Notifications"]')
      if (await notificationBell.isVisible()) {
        await notificationBell.click()
        
        // Should show notification panel
        await expect(page.locator('text=Notifications')).toBeVisible()
      }
    })
  })
})
