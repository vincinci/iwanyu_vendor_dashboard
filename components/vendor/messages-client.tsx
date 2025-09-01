"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MessageSquare, Plus, Eye } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  is_read: boolean
  profiles?: {
    full_name?: string
    avatar_url?: string
  }
}

interface MessageThread {
  id: string
  subject: string
  status: string
  priority: string
  created_at: string
  messages?: Message[]
}

interface MessagesClientProps {
  messageThreads: MessageThread[]
  userId?: string
}

export function MessagesClient({ messageThreads, userId }: MessagesClientProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      case "archived":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "normal":
        return "bg-blue-100 text-blue-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredThreads = messageThreads.filter(thread =>
    thread.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground">Communicate with platform administrators</p>
        </div>
        <Button asChild>
          <Link href="/vendor/messages/new">
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Message Threads</CardTitle>
          <CardDescription>Your conversations with administrators</CardDescription>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search messages..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredThreads?.length ? (
            <div className="space-y-4">
              {filteredThreads.map((thread) => {
                const lastMessage = thread.messages?.[thread.messages.length - 1]
                const unreadCount =
                  thread.messages?.filter((m) => !m.is_read && m.sender_id !== userId).length || 0

                return (
                  <Card key={thread.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={lastMessage?.profiles?.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {lastMessage?.profiles?.full_name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase() || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{thread.subject}</h3>
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {unreadCount} new
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {lastMessage?.content || "No messages yet"}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(thread.status)}>{thread.status}</Badge>
                            <Badge className={getPriorityColor(thread.priority)}>{thread.priority}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {lastMessage ? new Date(lastMessage.created_at).toLocaleDateString() : ""}
                        </p>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/vendor/messages/${thread.id}`}>
                            <Eye className="mr-2 h-3 w-3" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground mb-4">Start a conversation with platform administrators.</p>
              <Button asChild>
                <Link href="/vendor/messages/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Send Your First Message
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
