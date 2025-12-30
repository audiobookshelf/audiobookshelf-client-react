'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useRef } from 'react'
import Btn from '../ui/Btn'

interface FilePickerProps {
  onFilesSelected: (files: FileList) => void
  accept?: string
  multiple?: boolean
  directory?: boolean
  disabled?: boolean
  children?: React.ReactNode
  className?: string
}

export default function FilePicker({
  onFilesSelected,
  accept = '*',
  multiple = false,
  directory = false,
  disabled = false,
  children,
  className = ''
}: FilePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = useTypeSafeTranslations()

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(e.target.files)
      // Reset input so the same file can be selected again
      e.target.value = ''
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        //@ts-expect-error react types do not yet support webkitdirectory, but this works fine
        webkitdirectory={directory ? 'true' : undefined}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <Btn onClick={handleClick} disabled={disabled} className={className}>
        {children || t('ButtonChooseFiles')}
      </Btn>
    </>
  )
}
