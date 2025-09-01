import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, FileText, Calendar } from "lucide-react"
import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Terms and conditions for using Iwanyu Marketplace
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Last updated: January 2024</span>
          </div>
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

        {/* Terms Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Iwanyu Marketplace Terms of Service</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                By accessing and using Iwanyu Marketplace ("Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, you should not use this platform.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                2. Use License
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Permission is granted to temporarily use Iwanyu Marketplace for personal and commercial viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on the website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                3. Vendor Responsibilities
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                As a vendor on Iwanyu Marketplace, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Provide accurate and truthful product information</li>
                <li>Fulfill orders in a timely manner</li>
                <li>Maintain appropriate customer service standards</li>
                <li>Comply with all applicable Rwanda laws and regulations</li>
                <li>Pay applicable platform fees and taxes</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                4. Customer Responsibilities
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                As a customer on Iwanyu Marketplace, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Provide accurate billing and shipping information</li>
                <li>Make payments in good faith</li>
                <li>Treat vendors and other users with respect</li>
                <li>Report any issues or disputes in a timely manner</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                5. Payment and Fees
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Iwanyu Marketplace charges a commission on sales made through the platform. Payment processing is handled through secure third-party providers. All prices are displayed in Rwanda Francs (RWF). Vendors are responsible for applicable taxes on their sales.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                6. Privacy and Data Protection
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We are committed to protecting your privacy. Please review our Privacy Policy, which also governs your use of the platform, to understand our practices.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                7. Limitation of Liability
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                In no event shall Iwanyu Marketplace or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the platform, even if Iwanyu or its authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                8. Governing Law
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                These terms and conditions are governed by and construed in accordance with the laws of Rwanda, and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                9. Contact Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Iwanyu Marketplace</strong><br />
                  Email: legal@iwanyu.com<br />
                  Phone: +250 788 123 456<br />
                  Address: Kigali, Rwanda
                </p>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Footer Navigation */}
        <div className="flex justify-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/privacy">
              Privacy Policy
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/support">
              Contact Support
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
