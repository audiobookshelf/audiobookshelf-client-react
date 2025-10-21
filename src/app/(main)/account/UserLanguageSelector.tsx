'use client'

import LanguageDropdown from '@/components/widgets/LanguageDropdown'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface UserLanguageSelectorProps {
  value: string
  label: string
}

export default function UserLanguageSelector({ value, label }: UserLanguageSelectorProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLanguageChange = async (newLanguage: string) => {
    if (newLanguage === value) return

    setIsLoading(true)
    try {
      const res = await fetch('/internal-api/set-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ language: newLanguage, scope: 'user' })
      })

      if (!res.ok) {
        console.error('Failed to set language:', res.status, res.statusText)
        return
      }

      // Refresh the page to apply the new language
      router.refresh()
    } catch (error) {
      console.error('Error setting language:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return <LanguageDropdown value={value} label={label} disabled={isLoading} onChange={handleLanguageChange} />
}
