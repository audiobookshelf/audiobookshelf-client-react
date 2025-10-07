'use client'

import InputDropdown from '@/components/ui/InputDropdown'
import { useState } from 'react'

export default function GlobalSearchInput() {
  const [searchValue, setSearchValue] = useState('')
  return (
    <div className="relative">
      <InputDropdown items={[]} size="small" placeholder="Search..." value={searchValue} onChange={(value) => setSearchValue(String(value))} />
      <div className="absolute end-0 top-0 h-full w-10 flex items-center justify-center">
        <span className="material-symbols text-gray-400 text-lg">search</span>
      </div>
    </div>
  )
}
