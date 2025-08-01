'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface LibrariesDropdownProps {
  libraries: any[]
  currentLibraryId: string
}

export default function LibrariesDropdown({ libraries, currentLibraryId }: LibrariesDropdownProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <div className="relative w-max">
      <select
        className="appearance-none bg-primary border border-gray-600 rounded px-4 py-2 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        value={currentLibraryId}
        disabled={isPending}
        onChange={(e) => {
          startTransition(() => {
            router.push(`/library/${e.target.value}`)
          })
        }}
      >
        {libraries.map((library) => (
          <option key={library.id} value={library.id}>
            {library.name}
          </option>
        ))}
      </select>
      {/* Custom SVG arrow */}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  )
}
