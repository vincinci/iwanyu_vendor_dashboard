import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Search, Filter, Reply, Archive, Trash2 } from "lucide-react"

export default function AdminMessagesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <MessageSquare className="mr-2 h-4 w-4" />
            New Message
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search messages..." className="pl-8" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <Suspense fallback={<MessagesPageSkeleton />}>
        <MessagesList />
      </Suspense>
    </div>
  )
}

async function MessagesList() {
  // In a real app, this would fetch from your database
  const messages = [
    {
      id: 1,
      from: "John Vendor",
      subject: "Product approval request",
      preview: "Hello, I would like to submit my new product for approval...",
      timestamp: "2 hours ago",
      read: false,
      priority: "high",
      type: "vendor_inquiry"
    },
    {
      id: 2,
      from: "Sarah Customer",
      subject: "Order delivery issue",
      preview: "My order #12345 was supposed to be delivered today but...",
      timestamp: "4 hours ago",
      read: true,
      priority: "medium",
      type: "customer_support"
    },
    {
      id: 3,
      from: "Mike Vendor",
      subject: "Payment question",
      preview: "I have a question about my last payout...",
      timestamp: "1 day ago",
      read: true,
      priority: "low",
      type: "payment_inquiry"
    }
  ]

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Card key={message.id} className={`cursor-pointer transition-colors hover:bg-muted/50 ${!message.read ? 'border-l-4 border-l-primary' : ''}`}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <Avatar>
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback>{message.from.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium truncate">{message.from}</h3>
                    <Badge variant={message.priority === "high" ? "destructive" : message.priority === "medium" ? "default" : "secondary"}>
                      {message.priority}
                    </Badge>
                    <Badge variant="outline">
                      {message.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <h4 className={`text-sm ${!message.read ? 'font-semibold' : ''} truncate`}>
                    {message.subject}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {message.preview}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                {!message.read && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Reply className="mr-1 h-3 w-3" />
                Reply
              </Button>
              <Button variant="outline" size="sm">
                <Archive className="mr-1 h-3 w-3" />
                Archive
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {messages.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No messages</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              You don't have any messages yet. Check back later.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MessagesPageSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
