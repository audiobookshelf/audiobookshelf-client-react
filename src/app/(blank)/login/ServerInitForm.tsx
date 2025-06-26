'use client'

import { useState } from 'react'

export default function ServerInitForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setError('Username is required')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!password) {
      if (!confirm('Are you sure you want to create the root user with no password?')) {
        return
      }
    }

    setError('')
    setLoading(true)
    try {
      const payload = {
        newRoot: {
          username,
          password
        }
      }
      const res = await fetch('/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error || 'Unknown error')
        setLoading(false)
        return
      }
      window.location.href = '/'
    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-bg border border-gray-600 rounded-lg shadow-lg p-10 w-full max-w-md">
      <h2 className="text-2xl font-bold text-center mb-6 text-postcss">Initial server setup</h2>

      <div className="flex flex-col gap-2 mb-4">
        <label htmlFor="username" className="text-gray-300 text-sm font-semibold">
          USERNAME
        </label>
        <input id="username" type="text" autoComplete="username" className="bg-primary border border-gray-600 rounded px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-2 mb-4">
        <label htmlFor="password" className="text-gray-300 text-sm font-semibold">
          PASSWORD
        </label>
        <input id="password" type="password" autoComplete="current-password" className="bg-primary border border-gray-600 rounded px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2 mb-4">
        <label htmlFor="password" className="text-gray-300 text-sm font-semibold">
          CONFIRM PASSWORD
        </label>
        <input id="password" type="password" autoComplete="current-password" className="bg-primary border border-gray-600 rounded px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      </div>
      {error && <div className="text-red-400 text-center text-sm mb-4">{error}</div>}
      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="bg-primary border border-gray-600 rounded px-8 py-2 text-white font-semibold hover:bg-gray-700 transition disabled:opacity-50">
          {loading ? 'Logging in...' : 'Submit'}
        </button>
      </div>
    </form>
  )
}
