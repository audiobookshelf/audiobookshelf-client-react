'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import type { EreaderTocItem } from '@/lib/ereader/ereaderToc'
import { mergeClasses } from '@/lib/merge-classes'

interface EreaderTocDrawerProps {
  isOpen: boolean
  shellClass: string
  items: EreaderTocItem[]
  onClose: () => void
  onGoTo: (href: string) => void
}

export default function EreaderTocDrawer({ isOpen, shellClass, items, onClose, onGoTo }: EreaderTocDrawerProps) {
  const t = useTypeSafeTranslations()

  const handleGoTo = (href: string) => {
    onGoTo(href)
    onClose()
  }

  return (
    <>
      {isOpen && <button type="button" className="absolute inset-0 z-20 bg-black/20" onClick={onClose} aria-label={t('ButtonClose')} />}
      <aside
        className={mergeClasses(
          'absolute start-0 top-0 z-30 flex h-full w-96 max-w-full flex-col shadow-xl transition-transform duration-200',
          shellClass,
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-full flex-col p-4">
          <div className="mb-2 flex items-center">
            <button type="button" className="material-symbols text-2xl opacity-80 hover:opacity-100" onClick={onClose} aria-label={t('ButtonClose')}>
              arrow_back
            </button>
            <p className="ms-2 text-lg font-semibold">{t('HeaderTableOfContents')}</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <p className="py-4 text-center text-sm opacity-70">{t('LabelNotAvailable')}</p>
            ) : (
              <ul>
                {items.map((item) => (
                  <TocEntry key={item.id} item={item} onGoTo={handleGoTo} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

function TocEntry({ item, onGoTo }: { item: EreaderTocItem; onGoTo: (href: string) => void }) {
  return (
    <li className="py-1">
      <button type="button" className="text-start opacity-80 hover:opacity-100" onClick={() => onGoTo(item.href)}>
        {item.label}
      </button>
      {item.subitems && item.subitems.length > 0 && (
        <ul className="ps-4">
          {item.subitems.map((subitem) => (
            <TocEntry key={subitem.id} item={subitem} onGoTo={onGoTo} />
          ))}
        </ul>
      )}
    </li>
  )
}
