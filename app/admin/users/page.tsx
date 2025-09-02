import { createClient } from "@/utils/supabase-server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Eye, Shield, Users, UserCheck, UserX } from "lucide-react"
import Link from "next/link"

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "vendor":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage all platform users</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Complete list of platform users</CardDescription>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Search users..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {users?.length ? (
            <div className="space-y-4">
              {users.map((user: any) => {
                const initials = user.full_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()

                return (
                  <Card key={user.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.full_name} />
                          <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h3 className="font-semibold">{user.full_name || "No name"}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center space-x-2">
                            <Badge className={getRoleColor(user.role)}>
                              {user.role === "admin" ? (
                                <Shield className="mr-1 h-3 w-3" />
                              ) : (
                                <Users className="mr-1 h-3 w-3" />
                              )}
                              {user.role}
                            </Badge>
                            <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Phone: {user.phone || "Not provided"}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/users/${user.id}`}>
                              <Eye className="mr-2 h-3 w-3" />
                              View
                            </Link>
                          </Button>
                          {user.status === "active" && (
                            <Button size="sm" variant="destructive">
                              <UserX className="mr-2 h-3 w-3" />
                              Suspend
                            </Button>
                          )}
                          {user.status === "suspended" && (
                            <Button size="sm" variant="default">
                              <UserCheck className="mr-2 h-3 w-3" />
                              Activate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">Users will appear here as they register on the platform.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
