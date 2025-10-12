'use client'

import InputDropdown from '@/components/ui/InputDropdown'
import { useCallback, useEffect, useRef, useState } from 'react'

interface GlobalSearchInputProps {
  onSubmit?: () => void
  autoFocus?: boolean
}

export default function GlobalSearchInput({ onSubmit, autoFocus = false }: GlobalSearchInputProps) {
  const [searchValue, setSearchValue] = useState('')
  const inputRef = useRef<{ focus: () => void }>(null)
  const [shouldFocus, setShouldFocus] = useState(false)

  // Focus the input when shouldFocus becomes true
  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      inputRef.current.focus()
      setShouldFocus(false)
    }
  }, [shouldFocus])

  // Auto-focus when autoFocus prop is true
  useEffect(() => {
    if (autoFocus) {
      setShouldFocus(true)
    }
  }, [autoFocus])

  const handleSearchSelect = useCallback(
    (value: string | number) => {
      setSearchValue(String(value))
      onSubmit?.()
    },
    [onSubmit]
  )

  return (
    <div className="relative">
      <InputDropdown ref={inputRef} items={[]} size="small" placeholder="Search..." value={searchValue} onChange={handleSearchSelect} />
      <div className="absolute end-0 top-0 h-full w-10 flex items-center justify-center">
        <span className="material-symbols text-gray-400 text-lg">search</span>
      </div>
    </div>
  )
}
