"use client"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Eye, EyeOff, Building2, Upload, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react"
import { uploadFile, saveFileMetadata, STORAGE_BUCKETS } from "@/lib/supabase/storage"
import { useLanguage } from "@/lib/i18n/context"
import { LanguageSelectionPopup } from "@/components/language-selection-popup"

interface FormData {
  // Step 1: Business Information
  businessName: string
  businessRegistrationNumber: string
  businessAddress: string
  contactPerson: string
  contactPhone: string
  facebookUrl: string
  instagramUrl: string
  tiktokUrl: string
  idDocument: File | null
  businessLicense: File | null

  // Step 2: Personal Information
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  personalPhone: string
  dateOfBirth: string
  personalAddress: string

  // Step 3: Additional Details
  storeDescription: string
  mobileMoneyInfo: {
    accountName: string
    phoneNumber: string
    provider: string
  }
}

export default function VendorSignupPage() {
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    businessRegistrationNumber: "",
    businessAddress: "",
    contactPerson: "",
    contactPhone: "",
    facebookUrl: "",
    instagramUrl: "",
    tiktokUrl: "",
    idDocument: null,
    businessLicense: null,
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    personalPhone: "",
    dateOfBirth: "",
    personalAddress: "",
    storeDescription: "",
    mobileMoneyInfo: {
      accountName: "",
      phoneNumber: "",
      provider: "",
    },
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: boolean }>({})
  const router = useRouter()

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      // Handle nested object updates (e.g., "mobileMoneyInfo.accountName")
      const [parentKey, childKey] = field.split('.')
      if (parentKey === 'mobileMoneyInfo') {
        setFormData((prev) => ({
          ...prev,
          mobileMoneyInfo: {
            ...prev.mobileMoneyInfo,
            [childKey]: value
          }
        }))
      }
    } else {
      // Handle direct property updates
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleFileUpload = async (field: string, file: File) => {
    setUploadProgress((prev) => ({ ...prev, [field]: true }))
    setFormData((prev) => ({ ...prev, [field]: file }))
    setUploadProgress((prev) => ({ ...prev, [field]: false }))
  }

  const validateStep = (step: number): boolean => {
    setError(null)

    switch (step) {
      case 1:
        if (
          !formData.businessName ||
          !formData.contactPerson ||
          !formData.contactPhone ||
          !formData.businessAddress
        ) {
          setError(t("businessInfo") + " - " + "Please fill in all required fields")
          return false
        }
        if (!formData.idDocument) {
          setError("Please upload your ID document")
          return false
        }
        break
      case 2:
        if (
          !formData.email ||
          !formData.password ||
          !formData.firstName ||
          !formData.lastName ||
          !formData.personalPhone
        ) {
          setError(t("personalInfo") + " - " + "Please fill in all required fields")
          return false
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match")
          return false
        }
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters long")
          return false
        }
        break
      case 3:
        if (!formData.storeDescription) {
          setError("Please provide a store description")
          return false
        }
        if (
          !formData.mobileMoneyInfo.accountName ||
          !formData.mobileMoneyInfo.phoneNumber ||
          !formData.mobileMoneyInfo.provider
        ) {
          setError("Please fill in all required mobile money information")
          return false
        }
        break
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            role: "vendor",
            registration_step: 1,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Failed to create user account")

      // Upload files if they exist
      let idDocumentPath = ""
      let businessLicensePath = ""

      if (formData.idDocument) {
        const idUploadResult = await uploadFile(
          formData.idDocument,
          STORAGE_BUCKETS.DOCUMENTS,
          `vendors/${authData.user.id}/id-documents`,
        )
        if (idUploadResult.success && idUploadResult.data) {
          idDocumentPath = idUploadResult.data.path
          await saveFileMetadata(
            formData.idDocument.name,
            idDocumentPath,
            formData.idDocument.type,
            formData.idDocument.size,
            STORAGE_BUCKETS.DOCUMENTS,
            "id_document",
          )
        }
      }

      if (formData.businessLicense) {
        const licenseUploadResult = await uploadFile(
          formData.businessLicense,
          STORAGE_BUCKETS.DOCUMENTS,
          `vendors/${authData.user.id}/business-documents`,
        )
        if (licenseUploadResult.success && licenseUploadResult.data) {
          businessLicensePath = licenseUploadResult.data.path
          await saveFileMetadata(
            formData.businessLicense.name,
            businessLicensePath,
            formData.businessLicense.type,
            formData.businessLicense.size,
            STORAGE_BUCKETS.DOCUMENTS,
            "business_license",
          )
        }
      }

      router.push("/auth/signup-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred during registration")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3))
    }
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="businessName" className="text-sm font-medium">
            {t("businessName")} *
          </Label>
          <Input
            id="businessName"
            placeholder={t("businessName")}
            value={formData.businessName}
            onChange={(e) => handleInputChange("businessName", e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessRegistrationNumber" className="text-sm font-medium">
          Business Registration Number
        </Label>
        <Input
          id="businessRegistrationNumber"
          placeholder="Enter registration number"
          value={formData.businessRegistrationNumber}
          onChange={(e) => handleInputChange("businessRegistrationNumber", e.target.value)}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Business Address *</Label>
        <Input
          placeholder="e.g., KK, 34th Street, Kigali"
          value={formData.businessAddress}
          onChange={(e) => handleInputChange("businessAddress", e.target.value)}
          className="h-11"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactPerson" className="text-sm font-medium">
            Contact Person *
          </Label>
          <Input
            id="contactPerson"
            placeholder="Primary contact name"
            value={formData.contactPerson}
            onChange={(e) => handleInputChange("contactPerson", e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactPhone" className="text-sm font-medium">
            {t("phoneNumber")} *
          </Label>
          <Input
            id="contactPhone"
            placeholder="+250 7XX XXX XXX"
            value={formData.contactPhone}
            onChange={(e) => handleInputChange("contactPhone", e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium">Social Media Links (Optional)</Label>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="facebookUrl" className="text-sm font-medium flex items-center gap-2">
              <span className="text-blue-600">Facebook</span>
            </Label>
            <Input
              id="facebookUrl"
              placeholder="https://facebook.com/yourbusiness"
              value={formData.facebookUrl}
              onChange={(e) => handleInputChange("facebookUrl", e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagramUrl" className="text-sm font-medium flex items-center gap-2">
              <span className="text-pink-600">Instagram</span>
            </Label>
            <Input
              id="instagramUrl"
              placeholder="https://instagram.com/yourbusiness"
              value={formData.instagramUrl}
              onChange={(e) => handleInputChange("instagramUrl", e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiktokUrl" className="text-sm font-medium flex items-center gap-2">
              <span className="text-black">TikTok</span>
            </Label>
            <Input
              id="tiktokUrl"
              placeholder="https://tiktok.com/@yourbusiness"
              value={formData.tiktokUrl}
              onChange={(e) => handleInputChange("tiktokUrl", e.target.value)}
              className="h-11"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("idDocument")} *</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => e.target.files?.[0] && handleFileUpload("idDocument", e.target.files[0])}
              className="hidden"
              id="idDocument"
            />
            <label htmlFor="idDocument" className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {formData.idDocument ? formData.idDocument.name : t("uploadDocument")}
              </p>
            </label>
            {formData.idDocument && <CheckCircle className="h-5 w-5 text-green-500 mx-auto mt-2" />}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("businessLicense")} (Optional)</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => e.target.files?.[0] && handleFileUpload("businessLicense", e.target.files[0])}
              className="hidden"
              id="businessLicense"
            />
            <label htmlFor="businessLicense" className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {formData.businessLicense ? formData.businessLicense.name : t("uploadDocument")}
              </p>
            </label>
            {formData.businessLicense && <CheckCircle className="h-5 w-5 text-green-500 mx-auto mt-2" />}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium">
            {t("firstName")} *
          </Label>
          <Input
            id="firstName"
            placeholder={t("firstName")}
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium">
            {t("lastName")} *
          </Label>
          <Input
            id="lastName"
            placeholder={t("lastName")}
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            {t("email")} *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={t("email")}
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="personalPhone" className="text-sm font-medium">
            {t("phoneNumber")} *
          </Label>
          <Input
            id="personalPhone"
            placeholder="+250 7XX XXX XXX"
            value={formData.personalPhone}
            onChange={(e) => handleInputChange("personalPhone", e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth" className="text-sm font-medium">
          {t("dateOfBirth")}
        </Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Personal Address</Label>
        <Input
          placeholder="e.g., KK, 45th Street, Kigali"
          value={formData.personalAddress}
          onChange={(e) => handleInputChange("personalAddress", e.target.value)}
          className="h-11"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            {t("password")} *
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("password")}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            {t("confirmPassword")} *
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t("confirmPassword")}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="storeDescription" className="text-sm font-medium">
          Store Description *
        </Label>
        <Textarea
          id="storeDescription"
          placeholder="Describe your store and the products you plan to sell..."
          value={formData.storeDescription}
          onChange={(e) => handleInputChange("storeDescription", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Mobile Money Information *</Label>
        <div className="grid grid-cols-1 gap-3">
          <Input
            placeholder="Account Name (as registered on mobile money)"
            value={formData.mobileMoneyInfo.accountName}
            onChange={(e) => handleInputChange("mobileMoneyInfo.accountName", e.target.value)}
            className="h-11"
          />
          <Input
            placeholder="Mobile Money Number (e.g., +250 7XX XXX XXX)"
            value={formData.mobileMoneyInfo.phoneNumber}
            onChange={(e) => handleInputChange("mobileMoneyInfo.phoneNumber", e.target.value)}
            className="h-11"
          />
          <Select
            value={formData.mobileMoneyInfo.provider}
            onValueChange={(value) => handleInputChange("mobileMoneyInfo.provider", value)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select Mobile Money Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mtn_momo">MTN Mobile Money</SelectItem>
              <SelectItem value="airtel_money">Airtel Money</SelectItem>
              <SelectItem value="tigo_cash">Tigo Cash</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return t("businessInfo")
      case 2:
        return t("personalInfo")
      case 3:
        return t("additionalInfo")
      default:
        return "Registration"
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Tell us about your business and upload required documents"
      case 2:
        return "Provide your personal details and create your account"
      case 3:
        return "Complete your profile with store details and payment information"
      default:
        return "Complete your vendor registration"
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary rounded-lg p-3">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Iwanyu</h1>
          <p className="text-muted-foreground mt-2">Vendor Registration</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
              </div>
              {step < 3 && <div className={`w-16 h-1 mx-2 ${step < currentStep ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold">{getStepTitle()}</CardTitle>
            <CardDescription className="text-muted-foreground">{getStepDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center gap-2 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("previous")}
              </Button>

              {currentStep < 3 ? (
                <Button type="button" onClick={handleNext} className="flex items-center gap-2">
                  {t("next")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-2">
                  {isLoading ? "Creating Account..." : "Complete Registration"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
              {t("login")}
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            By registering, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:text-primary/80">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:text-primary/80">
              Privacy Policy
            </Link>
          </p>
        </div>
        
        <LanguageSelectionPopup />
      </div>
    </div>
  )
}
