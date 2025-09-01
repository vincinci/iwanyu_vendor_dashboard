import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  MessageSquare, 
  Phone, 
  Mail, 
  MapPin,
  Clock,
  HelpCircle,
  BookOpen,
  Users,
  Send
} from "lucide-react"
import Link from "next/link"

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Support Center
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            We're here to help you with any questions or issues
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/auth/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Send us a Message</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Your full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="your@email.com" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Brief description of your issue" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select 
                    id="category" 
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a category</option>
                    <option value="account">Account Issues</option>
                    <option value="orders">Order Support</option>
                    <option value="payments">Payment Issues</option>
                    <option value="vendor">Vendor Support</option>
                    <option value="technical">Technical Problems</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Please describe your issue in detail..."
                    className="min-h-[120px]"
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Contact Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-muted-foreground">support@iwanyu.com</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-muted-foreground">+250 788 123 456</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Office Address</p>
                    <p className="text-sm text-muted-foreground">Kigali, Rwanda</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Business Hours</p>
                    <p className="text-sm text-muted-foreground">
                      Monday - Friday: 8:00 AM - 6:00 PM (CAT)<br />
                      Saturday: 9:00 AM - 2:00 PM (CAT)<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HelpCircle className="h-5 w-5" />
                  <span>Quick Help</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Common Issues</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Password reset problems</li>
                    <li>• Order tracking questions</li>
                    <li>• Payment and billing issues</li>
                    <li>• Vendor registration help</li>
                    <li>• Product upload assistance</li>
                  </ul>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-medium">Response Times</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Email:</span>
                      <Badge variant="secondary">24-48 hours</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Phone:</span>
                      <Badge variant="default">Immediate</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Frequently Asked Questions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">How do I create a vendor account?</h4>
                  <p className="text-sm text-muted-foreground">
                    Click "Sign Up" on the login page and select "Vendor Account". Fill out the registration form with your business details.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">How do I reset my password?</h4>
                  <p className="text-sm text-muted-foreground">
                    Click "Forgot Password" on the login page and enter your email address. We'll send you a reset link.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">What payment methods do you accept?</h4>
                  <p className="text-sm text-muted-foreground">
                    We accept mobile money, bank transfers, and major credit cards. All transactions are in Rwanda Francs (RWF).
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">How do I track my order?</h4>
                  <p className="text-sm text-muted-foreground">
                    After placing an order, you'll receive a tracking number via email. Use this to track your order status.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">What is the commission rate for vendors?</h4>
                  <p className="text-sm text-muted-foreground">
                    Our standard commission rate is 5% per sale. This covers payment processing and platform services.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">How do I contact a vendor directly?</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the messaging system within your account to communicate directly with vendors about orders or products.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Community & Resources</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h4 className="font-medium mb-1">User Guide</h4>
                <p className="text-sm text-muted-foreground">
                  Complete documentation and tutorials
                </p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h4 className="font-medium mb-1">Community Forum</h4>
                <p className="text-sm text-muted-foreground">
                  Connect with other users and vendors
                </p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <HelpCircle className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <h4 className="font-medium mb-1">Video Tutorials</h4>
                <p className="text-sm text-muted-foreground">
                  Step-by-step video guides
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="flex justify-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/terms">
              Terms of Service
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/privacy">
              Privacy Policy
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
