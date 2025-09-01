import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DatabaseHealthChecker } from '@/components/database-health-checker'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Smartphone, 
  Menu, 
  Database, 
  CheckCircle, 
  Settings,
  Monitor,
  Tablet
} from 'lucide-react'

export default function SystemStatusPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">System Status & Mobile Menu Demo</h1>
        <p className="text-muted-foreground">
          Mobile-responsive navigation and database health monitoring
        </p>
      </div>

      {/* Mobile Menu Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Menu className="h-5 w-5" />
            Mobile Menu Features
          </CardTitle>
          <CardDescription>
            Responsive navigation system with retractable mobile sidebar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Smartphone className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium">Mobile Optimized</div>
                <div className="text-sm text-muted-foreground">Hamburger menu on phones</div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Tablet className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">Tablet Responsive</div>
                <div className="text-sm text-muted-foreground">Adaptive layout for tablets</div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Monitor className="h-5 w-5 text-purple-500" />
              <div>
                <div className="font-medium">Desktop Sidebar</div>
                <div className="text-sm text-muted-foreground">Full sidebar on desktop</div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Mobile Menu Instructions:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• On mobile devices, tap the hamburger menu (☰) in the top-left corner</li>
              <li>• The sidebar slides in from the left with all navigation options</li>
              <li>• Tap any menu item to navigate and automatically close the menu</li>
              <li>• Tap the X button or outside the menu to close</li>
              <li>• On desktop, the sidebar is always visible on the left</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Database Health Check */}
      <DatabaseHealthChecker />

      {/* System Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Dashboard Features
          </CardTitle>
          <CardDescription>
            Complete mobile e-commerce platform features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Mobile-First Design', status: 'Ready' },
              { name: 'Retractable Navigation', status: 'Ready' },
              { name: 'Product Management', status: 'Ready' },
              { name: 'Image Upload System', status: 'Needs Setup' },
              { name: 'User Authentication', status: 'Ready' },
              { name: 'Order Management', status: 'Ready' },
              { name: 'Admin Dashboard', status: 'Ready' },
              { name: 'Vendor Portal', status: 'Ready' },
              { name: 'Real-time Notifications', status: 'Needs Setup' },
            ].map((feature, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{feature.name}</span>
                <Badge variant={feature.status === 'Ready' ? 'default' : 'secondary'}>
                  {feature.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mobile Testing Instructions */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-blue-900">Mobile Testing Guide</CardTitle>
          <CardDescription className="text-blue-700">
            How to test the mobile menu on different devices
          </CardDescription>
        </CardHeader>
        <CardContent className="text-blue-900">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium">Browser Testing:</h4>
              <p className="text-sm">Open Chrome DevTools (F12) → Click responsive icon → Select mobile device</p>
            </div>
            <div>
              <h4 className="font-medium">Physical Device:</h4>
              <p className="text-sm">Access the dashboard on your phone/tablet to test touch interactions</p>
            </div>
            <div>
              <h4 className="font-medium">What to Test:</h4>
              <ul className="text-sm space-y-1">
                <li>• Menu button visibility on mobile</li>
                <li>• Sidebar slide animation</li>
                <li>• Menu item touch targets</li>
                <li>• Automatic menu closing</li>
                <li>• Header responsiveness</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
