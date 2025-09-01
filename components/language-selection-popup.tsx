"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import type { Language } from "@/lib/i18n/translations"

export function LanguageSelectionPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()

  useEffect(() => {
    // Show popup if no language preference is saved and not shown in this session
    const savedLanguage = localStorage.getItem("iwanyu-language")
    const shownInSession = sessionStorage.getItem("language-popup-shown")
    
    if (!savedLanguage && !shownInSession) {
      setIsOpen(true)
    }
  }, [])

  const handleLanguageSelect = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage)
    sessionStorage.setItem("language-popup-shown", "true")
    setIsOpen(false)
  }

  const languages = [
    { code: "en" as Language, name: "English", flag: "🇺🇸", nativeName: "English" },
    { code: "fr" as Language, name: "Français", flag: "🇫🇷", nativeName: "Français" },
    { code: "rw" as Language, name: "Kinyarwanda", flag: "🇷🇼", nativeName: "Ikinyarwanda" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold text-gray-900">{t("selectLanguage")}</DialogTitle>
          <DialogDescription className="text-center text-gray-600">{t("selectLanguageDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {languages.map((lang) => (
            <Card
              key={lang.code}
              className="cursor-pointer transition-all hover:shadow-md hover:border-yellow-400"
              onClick={() => handleLanguageSelect(lang.code)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <p className="font-medium text-gray-900">{lang.name}</p>
                    <p className="text-sm text-gray-600">{lang.nativeName}</p>
                  </div>
                </div>
                {language === lang.code && <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-center pt-2">
          <Button onClick={() => setIsOpen(false)} variant="outline" className="text-gray-600">
            {t("cancel")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
