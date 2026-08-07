import type { ConfirmState } from '@/components/widgets/ConfirmDialog'
import { openSimpleConfirm } from '@/lib/confirmDialogs'
import { bytesPretty } from '@/lib/string'
import type { LibraryItem } from '@/types/api'
import type { TypeSafeTranslations } from '@/types/translations'

type SetConfirmState = (state: ConfirmState | null) => void

export interface PodcastDeviceDownloadItem {
  title: string
  downloadSize: number
}

export function getLibraryItemDownloadSize(item: LibraryItem): number {
  return item.size ?? item.media.size ?? 0
}

function formatSizeForConfirm(size: number): string {
  return size > 0 ? bytesPretty(size) : ''
}

interface OpenPodcastDeviceDownloadConfirmOptions {
  items: PodcastDeviceDownloadItem[]
  t: TypeSafeTranslations
  setConfirmState: SetConfirmState
  onConfirm: () => void
}

export function openPodcastDeviceDownloadConfirm({ items, t, setConfirmState, onConfirm }: OpenPodcastDeviceDownloadConfirmOptions) {
  if (!items.length) return

  const totalSize = items.reduce((sum, item) => sum + item.downloadSize, 0)
  const sizeText = formatSizeForConfirm(totalSize)

  const message =
    items.length === 1
      ? sizeText
        ? t('MessageConfirmDownloadPodcastToDevice', { title: items[0].title, size: sizeText })
        : t('MessageConfirmDownloadPodcastToDeviceNoSize', { title: items[0].title })
      : sizeText
        ? t('MessageConfirmDownloadPodcastsToDevice', { count: items.length, size: sizeText })
        : t('MessageConfirmDownloadPodcastsToDeviceNoSize', { count: items.length })

  openSimpleConfirm({
    message,
    yesButtonText: t('LabelDownload'),
    yesButtonClassName: 'bg-success',
    setConfirmState,
    onConfirm
  })
}
