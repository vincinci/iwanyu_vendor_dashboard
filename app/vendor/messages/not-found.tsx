import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageCircle, ArrowLeft, Send } from "lucide-react"

export default function MessagesNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-auto text-center px-6">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-6">
            <MessageCircle className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-200 dark:text-gray-700 mb-4">💬</h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            💬 Message not available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The message or conversation you're looking for doesn't exist or may have been deleted.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/vendor/messages">
              <MessageCircle className="mr-2 h-4 w-4" />
              View All Messages
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/vendor/messages">
              <Send className="mr-2 h-4 w-4" />
              Start New Conversation
            </Link>
          </Button>

          <Button variant="ghost" asChild className="w-full">
            <Link href="/vendor">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need to contact someone? <Link href="/vendor/messages" className="text-primary hover:underline">Browse messages</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
