'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/logout', {
        method: 'POST',
        credentials: 'include'
      })
      router.replace('/login')
    } catch (err) {
      setLoading(false)
    }
  }

  return (
    <button type="button" className="bg-primary border-gray-600 border text-white px-4 py-2 rounded-md cursor-pointer" onClick={handleLogout} disabled={loading}>
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  )
}
