'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import React, { useCallback, useId, useRef, useState } from 'react'
import Btn from './Btn'
import IconBtn from './IconBtn'

interface FileInputProps {
  accept?: string
  children: React.ReactNode
  onChange?: (file: File) => void
  className?: string
  ariaLabel?: string
}

export default function FileInput({ accept = '.png, .jpg, .jpeg, .webp', children, onChange, className = '', ariaLabel }: FileInputProps) {
  const t = useTypeSafeTranslations()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFileName, setSelectedFileName] = useState<string>('')

  const clickUpload = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  const inputChanged = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target || !e.target.files) return

      const files = Array.from(e.target.files)
      if (files && files.length) {
        const file = files[0]
        setSelectedFileName(file.name)
        onChange?.(file)
        // Reset the input value so the same file can be selected again
        e.target.value = ''
      }
    },
    [onChange]
  )

  const inputId = `file-input-${useId()}`
  const label = ariaLabel || t('LabelChooseFile')
  const selectedFileText = selectedFileName ? t('LabelSelectedFile', { fileName: selectedFileName }) : ''

  return (
    <div className={className}>
      <input ref={fileInputRef} type="file" accept={accept} className="hidden" onChange={inputChanged} id={inputId} aria-label={label} tabIndex={-1} />
      <Btn onClick={clickUpload} color="bg-primary" className="hidden md:block w-full" ariaLabel={label}>
        {children}
      </Btn>
      <IconBtn onClick={clickUpload} className="block md:hidden" ariaLabel={label}>
        Upload
      </IconBtn>
      {selectedFileName && (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {selectedFileText}
        </div>
      )}
    </div>
  )
}
