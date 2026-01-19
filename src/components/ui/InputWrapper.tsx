'use client'

import { mergeClasses } from '@/lib/merge-classes'

export interface InputWrapperProps {
  children: React.ReactNode
  disabled?: boolean
  readOnly?: boolean
  error?: boolean | string
  borderless?: boolean
  size?: 'small' | 'medium' | 'large' | 'auto'
  className?: string
  inputRef?: React.RefObject<HTMLElement | null>
}

const InputWrapper = ({
  children,
  disabled = false,
  readOnly = false,
  error = false,
  borderless = false,
  size = 'medium',
  className,
  inputRef
}: InputWrapperProps) => {
  const wrapperClass = mergeClasses(
    // Base styles
    'relative flex items-center rounded-md px-2 focus-within:outline',

    // Size-based padding
    size === 'small' ? 'min-h-9' : size === 'large' ? 'min-h-11' : size === 'auto' ? 'h-full' : 'min-h-10',

    // Border and focus styles
    error ? 'border-error focus-within:outline-error' : 'border-border',

    // Background styles based on state
    disabled ? 'bg-bg-disabled cursor-not-allowed border-bg-disabled' : readOnly ? 'bg-bg-read-only' : borderless ? 'bg-transparent' : 'bg-primary',

    // Borderless styles
    borderless ? 'border-0' : 'border',

    // Custom className
    className
  )

  const handleClick = () => {
    if (!disabled) {
      if (document.activeElement !== inputRef?.current) {
        inputRef?.current?.focus()
      }
    }
  }

  return (
    <>
      <div className={wrapperClass} cy-id="control-wrapper" onClick={handleClick}>
        {children}
      </div>
      {error && <div className="text-error text-sm mt-1">{typeof error === 'string' ? error : 'Invalid value'}</div>}
    </>
  )
}

export default InputWrapper
