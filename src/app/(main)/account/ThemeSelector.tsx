'use client'

import ThemeDropdown from '@/components/widgets/ThemeDropdown'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ThemeSelectorProps {
  value: string
  label: string
}

export default function ThemeSelector({ value, label }: ThemeSelectorProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleThemeChange = async (newTheme: string) => {
    if (newTheme === value) return

    setIsLoading(true)
    try {
      const res = await fetch('/internal-api/set-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ theme: newTheme })
      })

      if (!res.ok) {
        console.error('Failed to set theme:', res.status, res.statusText)
        return
      }

      // Refresh the page to apply the new theme
      router.refresh()
    } catch (error) {
      console.error('Error setting theme:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return <ThemeDropdown value={value} label={label} disabled={isLoading} onChange={handleThemeChange} />
}
