'use client'

import Modal from '@/components/modals/Modal'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Fragment } from 'react'

interface PlayerShortcutsModalProps {
  isOpen: boolean
  /** The player's own tooltip strings, so the sheet cannot describe a jump the keys don't do */
  jumpForwardLabel: string
  jumpBackwardLabel: string
  onClose: () => void
}

interface ShortcutRow {
  keys: string[]
  description: string
}

interface ShortcutGroup {
  title: string
  rows: ShortcutRow[]
}

/** One key on the cheatsheet. Styled as a keycap so the keys read as keys, not as prose. */
function Keycap({ label }: { label: string }) {
  return (
    <kbd className="border-border bg-foreground-muted/10 text-foreground min-w-8 rounded-md border px-2 py-1 text-center font-mono text-xs leading-none font-semibold">
      {label}
    </kbd>
  )
}

/**
 * Cheatsheet for the player hotkeys, opened with `?`.
 *
 * Without it none of the hotkeys are discoverable — nothing else in the UI hints that they
 * exist. Rows are built from the same jump amounts the player is configured with, so the
 * sheet cannot drift from what the keys actually do.
 */
export default function PlayerShortcutsModal({ isOpen, jumpForwardLabel, jumpBackwardLabel, onClose }: PlayerShortcutsModalProps) {
  const t = useTypeSafeTranslations()

  const groups: ShortcutGroup[] = [
    {
      title: t('HeaderPlayback'),
      rows: [
        { keys: ['Space'], description: `${t('ButtonPlay')} / ${t('ButtonPause')}` },
        { keys: ['→'], description: jumpForwardLabel },
        { keys: ['←'], description: jumpBackwardLabel }
      ]
    },
    {
      title: t('LabelVolume'),
      rows: [
        { keys: ['↑'], description: t('LabelVolumeUp') },
        { keys: ['↓'], description: t('LabelVolumeDown') },
        { keys: ['M'], description: `${t('LabelMute')} / ${t('LabelUnmute')}` }
      ]
    },
    {
      title: t('LabelPlaybackRate'),
      rows: [
        { keys: ['.'], description: t('LabelPlaybackRateFaster') },
        { keys: [','], description: t('LabelPlaybackRateSlower') },
        { keys: ['Shift', '↑'], description: t('LabelPlaybackRateFaster') },
        { keys: ['Shift', '↓'], description: t('LabelPlaybackRateSlower') }
      ]
    },
    {
      title: t('LabelView'),
      rows: [
        { keys: ['L'], description: t('LabelViewChapters') },
        { keys: ['Esc'], description: t('LabelExitFullscreenPlayer') },
        { keys: ['?'], description: t('HeaderKeyboardShortcuts') }
      ]
    }
  ]

  const outerContent = (
    <div className="absolute start-0 top-0 p-4">
      <p className="text-xl text-white">{t('HeaderKeyboardShortcuts')}</p>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} outerContent={outerContent} className="sm:max-w-md md:max-w-md lg:max-w-md">
      <div className="max-h-[80vh] w-full overflow-y-auto p-4">
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="text-foreground-subdued mb-2 text-xs tracking-widest uppercase">{group.title}</p>
              <div className="flex flex-col gap-2">
                {/* Keyed on the keys, not the description — two bindings can do the same thing */}
                {group.rows.map((row) => (
                  <div key={row.keys.join('+')} className="flex items-center justify-between gap-4">
                    <span className="text-foreground min-w-0 text-sm">{row.description}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {row.keys.map((key, index) => (
                        <Fragment key={key}>
                          {index > 0 && <span className="text-foreground-subdued text-xs">+</span>}
                          <Keycap label={key} />
                        </Fragment>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
