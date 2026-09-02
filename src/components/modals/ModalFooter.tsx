'use client'

import Btn from '@/components/ui/Btn'
import { mergeClasses } from '@/lib/merge-classes'
import type { ReactNode } from 'react'

export type ModalFooterButton = {
  label: ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  to?: string
  className?: string
  ariaLabel?: string
}

export type ModalFooterProps = {
  /** Main action on the right e.g. "Save & Close", "Submit", "Create" */
  primary?: ModalFooterButton
  /** Action left of primary e.g. "Cancel", "Quick Match", "Save", "Change Password" */
  secondary?: ModalFooterButton
  /** Destructive action on the left e.g. "Remove", "Delete", "Disable" */
  destructive?: ModalFooterButton
  /** Custom content on the left e.g. "Unlink OpenID", "toggles", "checkboxes" */
  start?: ReactNode
  /** Show upward shadow when scrollable content sits above the footer */
  shadow?: boolean
  className?: string
}

function renderFooterButton(config: ModalFooterButton, { color, className }: { color?: string; className?: string }) {
  return (
    <Btn
      to={config.to}
      type={config.type}
      color={color}
      disabled={config.disabled}
      loading={config.loading}
      onClick={config.onClick}
      className={mergeClasses(className, config.className)}
      ariaLabel={config.ariaLabel}
    >
      {config.label}
    </Btn>
  )
}

export default function ModalFooter({ primary, secondary, destructive, start, shadow = false, className }: ModalFooterProps) {
  const hasRightActions = !!(secondary || primary)

  return (
    <div
      className={mergeClasses(
        'bg-bg border-border rounded-b-lg shrink-0 border-t px-4 py-3 transition-shadow duration-200 sm:px-6',
        shadow && 'box-shadow-md-up',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
        {start}
        {destructive &&
          renderFooterButton(destructive, {
            color: 'bg-error',
            className: mergeClasses(hasRightActions && 'mr-auto', destructive.className)
          })}
        {secondary && renderFooterButton(secondary, {})}
        {primary && renderFooterButton(primary, {})}
      </div>
    </div>
  )
}
