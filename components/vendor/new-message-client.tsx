"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Users, MessageSquare } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface NewMessageClientProps {
  userId: string
}

export function NewMessageClient({ userId }: NewMessageClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    recipientType: '',
    recipient: '',
    subject: '',
    priority: 'medium',
    category: '',
    message: ''
  })

  const router = useRouter()
  const supabase = createClient()

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create message thread first
      const { data: thread, error: threadError } = await supabase
        .from('message_threads')
        .insert({
          subject: formData.subject,
          priority: formData.priority,
          category: formData.category,
          vendor_id: userId,
          customer_id: formData.recipientType === 'customer' ? formData.recipient : null,
          status: 'open',
          created_by: userId
        })
        .select()
        .single()

      if (threadError) throw threadError

      // Create the first message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          thread_id: thread.id,
          sender_id: userId,
          content: formData.message,
          is_read: false
        })

      if (messageError) throw messageError

      toast.success("Message sent!", {
        description: "Your message has been sent successfully.",
      })

      router.push('/vendor/messages')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error("Error", {
        description: "Failed to send message. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const applyTemplate = (template: string) => {
    setFormData(prev => ({
      ...prev,
      message: template
    }))
  }

  const templates = [
    {
      name: "Order Shipped",
      content: "Thank you for your order! Your items have been shipped and you should receive them within 2-3 business days. Your tracking number is: [TRACKING_NUMBER]"
    },
    {
      name: "Product Inquiry",
      content: "Thank you for your inquiry about our product. I'd be happy to provide more information: [PRODUCT_DETAILS]"
    },
    {
      name: "Issue Resolution",
      content: "I understand your concern and I want to make this right. Let me investigate the issue and get back to you within 24 hours with a solution."
    },
    {
      name: "Thank You",
      content: "Thank you for your business! We appreciate your positive feedback and hope to serve you again in the future."
    }
  ]

  return (
    <div className="flex-1 space-y-6 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">New Message</h2>
          <p className="text-muted-foreground">Send a message to customers or support</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/vendor/messages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Messages
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Message Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Compose Message</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="recipientType">Recipient Type</Label>
                  <select 
                    id="recipientType"
                    name="recipientType"
                    value={formData.recipientType}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select recipient type</option>
                    <option value="customer">Customer</option>
                    <option value="support">Platform Support</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient</Label>
                  <Input 
                    id="recipient"
                    name="recipient"
                    value={formData.recipient}
                    onChange={handleInputChange}
                    placeholder="Enter email address or customer ID"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the email address or customer ID of the person you want to contact
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input 
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Enter message subject"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select 
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select 
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="order_inquiry">Order Inquiry</option>
                    <option value="product_question">Product Question</option>
                    <option value="shipping_update">Shipping Update</option>
                    <option value="payment_issue">Payment Issue</option>
                    <option value="refund_request">Refund Request</option>
                    <option value="general_support">General Support</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Type your message here..."
                    className="min-h-[200px]"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Be clear and detailed in your message. Include any relevant order numbers or product information.
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    <Send className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                  <Button type="button" variant="outline" disabled={isSubmitting}>
                    Save Draft
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Message Guidelines */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Message Guidelines</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Best Practices</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Be polite and professional</li>
                  <li>• Include relevant order/product details</li>
                  <li>• Use clear and concise language</li>
                  <li>• Respond promptly to customer inquiries</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Response Times</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Customer inquiries:</span>
                    <Badge variant="default">24 hours</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Urgent issues:</span>
                    <Badge variant="destructive">4 hours</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">General questions:</span>
                    <Badge variant="secondary">48 hours</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map((template, index) => (
                <Button 
                  key={index}
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-left"
                  onClick={() => applyTemplate(template.content)}
                  type="button"
                >
                  {template.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
