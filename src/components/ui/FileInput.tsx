'use client'

import React, { useRef, useCallback, useState, useId } from 'react'
import Btn from './Btn'
import IconBtn from './IconBtn'

interface FileInputProps {
  accept?: string
  children: React.ReactNode
  onChange?: (file: File) => void
  className?: string
  ariaLabel?: string
}

export default function FileInput({ 
  accept = '.png, .jpg, .jpeg, .webp',
  children,
  onChange,
  className = '',
  ariaLabel
}: FileInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFileName, setSelectedFileName] = useState<string>('')

  const reset = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      setSelectedFileName('')
    }
  }, [])

  const clickUpload = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  const inputChanged = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target || !e.target.files) return

    const files = Array.from(e.target.files)
    if (files && files.length) {
      const file = files[0]
      setSelectedFileName(file.name)
      onChange?.(file)
    }
  }, [onChange])

  const inputId = `file-input-${useId()}`
  const label = ariaLabel || 'Choose file'
  const selectedFileText = selectedFileName ? `Selected file: ${selectedFileName}` : ''

  return (
    <div className={className}>
      <input 
        ref={fileInputRef}
        type="file" 
        accept={accept} 
        className="hidden" 
        onChange={inputChanged}
        id={inputId}
        aria-label={label}
        tabIndex={-1}
      />
      <Btn 
        onClick={clickUpload}
        color="bg-primary" 
        className="hidden md:block w-full"
        ariaLabel={label}
      >
        {children}
      </Btn>
      <IconBtn 
        onClick={clickUpload}
        icon="upload" 
        className="block md:hidden"
        ariaLabel={label}
      />
      {selectedFileName && (
        <div 
          className="sr-only" 
          aria-live="polite"
          aria-atomic="true"
        >
          {selectedFileText}
        </div>
      )}
    </div>
  )
} 