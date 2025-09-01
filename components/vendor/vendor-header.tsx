"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Settings, User, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface VendorHeaderProps {
  user: any
  profile: any
}

export function VendorHeader({ user, profile }: VendorHeaderProps) {
  const router = useRouter()
  const supabase = createBrowserClient()

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "V"

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="bg-background border-b border-border px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile: Simplified header with just notifications and profile */}
        <div className="flex items-center space-x-4 flex-1 md:hidden">
          <div className="flex-1" /> {/* Spacer to push items to the right */}
        </div>

        {/* Desktop: Full header with search */}
        <div className="hidden md:flex items-center space-x-4 flex-1">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search products, orders..." className="pl-10" />
          </div>
        </div>

        <div className="flex items-center space-x-3 md:space-x-4">
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 md:h-10 md:w-10 rounded-full">
                <Avatar className="h-8 w-8 md:h-10 md:w-10">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.full_name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/vendor/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/vendor/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
