"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  BarChart3,
  MessageSquare,
  Settings,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/vendor",
    icon: LayoutDashboard,
  },
  {
    title: "Products",
    href: "/vendor/products",
    icon: Package,
  },
  {
    title: "Orders",
    href: "/vendor/orders",
    icon: ShoppingCart,
  },
  {
    title: "Payouts",
    href: "/vendor/payouts",
    icon: DollarSign,
  },
  {
    title: "Reports",
    href: "/vendor/reports",
    icon: BarChart3,
  },
  {
    title: "Messages",
    href: "/vendor/messages",
    icon: MessageSquare,
  },
  {
    title: "Profile",
    href: "/vendor/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/vendor/settings",
    icon: Settings,
  },
  {
    title: "System Status",
    href: "/vendor/system-status",
    icon: BarChart3,
  },
]

export function VendorSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const handleLinkClick = () => {
    setIsOpen(false) // Close mobile menu when link is clicked
  }

  const SidebarContent = () => (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-sidebar-primary rounded-lg p-2">
              <Package className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-sidebar-foreground">Iwanyu</h2>
              <p className="text-sm text-muted-foreground">Vendor Portal</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-10 px-3",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                )}
                asChild
              >
                <Link href={item.href} onClick={handleLinkClick}>
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start h-10 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar - Always visible on larger screens */}
      <div className="hidden md:flex">
        <SidebarContent />
      </div>

      {/* Mobile Menu Button - Visible only on small screens */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 bg-background border border-border shadow-lg"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetHeader className="sr-only">
              <SheetTitle>Vendor Navigation Menu</SheetTitle>
              <SheetDescription>
                Navigate through your vendor dashboard sections including products, orders, and profile management.
              </SheetDescription>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
