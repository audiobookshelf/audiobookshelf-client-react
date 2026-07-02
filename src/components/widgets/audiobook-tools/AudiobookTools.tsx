'use client'

import LibraryItemEditModal from '@/components/modals/LibraryItemEditModal'
import Dropdown from '@/components/ui/Dropdown'
import IconBtn from '@/components/ui/IconBtn'
import ConfirmDialog from '@/components/widgets/ConfirmDialog'
import AudioTracksProgressTable from '@/components/widgets/audiobook-tools/AudioTracksProgressTable'
import ChaptersPreviewTable from '@/components/widgets/audiobook-tools/ChaptersPreviewTable'
import EmbedMetadataPanel from '@/components/widgets/audiobook-tools/EmbedMetadataPanel'
import M4bEncodePanel from '@/components/widgets/audiobook-tools/M4bEncodePanel'
import MetadataPreviewTable from '@/components/widgets/audiobook-tools/MetadataPreviewTable'
import ToolsInfoNotes from '@/components/widgets/audiobook-tools/ToolsInfoNotes'
import { useMediaContext } from '@/contexts/MediaContext'
import { useAudiobookTools } from '@/hooks/useAudiobookTools'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { mergeClasses } from '@/lib/merge-classes'
import type { BookLibraryItem } from '@/types/api'
import Link from 'next/link'

interface AudiobookToolsProps {
  libraryItem: BookLibraryItem
}

export default function AudiobookTools({ libraryItem: initialLibraryItem }: AudiobookToolsProps) {
  const t = useTypeSafeTranslations()
  const { streamLibraryItem } = useMediaContext()
  const isStreaming = streamLibraryItem?.id === initialLibraryItem.id

  const tools = useAudiobookTools({ initialLibraryItem })

  return (
    <div className={mergeClasses('bg-bg relative min-h-full overflow-y-auto p-8', isStreaming && 'streaming')}>
      <div className="mb-6 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="mb-4 flex items-center">
            <Link href={`/library/${tools.libraryItem.libraryId}/item/${tools.libraryItem.id}`} className="hover:underline">
              <h1 className="text-lg lg:text-xl">{tools.title}</h1>
            </Link>
            <IconBtn ariaLabel={t('ButtonEdit')} borderless size="small" className="mx-4" onClick={() => tools.setIsEditModalOpen(true)}>
              edit
            </IconBtn>
          </div>
        </div>
        <div className="w-full max-w-2xl">
          <div className="flex justify-end">
            <Dropdown
              value={tools.selectedTool}
              items={tools.toolDropdownItems}
              disabled={tools.processing}
              className="max-w-sm"
              onChange={(value) => tools.setSelectedTool(value === 'm4b' ? 'm4b' : 'embed')}
            />
          </div>
        </div>
      </div>

      <div className="mb-2 flex justify-center">
        <div className="w-full max-w-2xl">
          <p className="text-lg">{t('HeaderMetadataToEmbed')}</p>
        </div>
        <div className="w-full max-w-2xl" />
      </div>

      <div className="flex flex-wrap justify-center gap-4 lg:flex-nowrap">
        <div className="w-full max-w-2xl">
          <MetadataPreviewTable metadataObject={tools.metadataObject} />
        </div>
        <div className="w-full max-w-2xl">
          <ChaptersPreviewTable chapters={tools.metadataChapters} />
        </div>
      </div>

      <div className="bg-foreground/10 my-8 h-px w-full" />

      <div className="mx-auto w-full max-w-4xl">
        {tools.isEmbedTool ? (
          <EmbedMetadataPanel
            isMetadataEmbedQueued={tools.isMetadataEmbedQueued}
            queuedEmbedCount={tools.queuedEmbedCount}
            processing={tools.processing}
            progress={tools.progress}
            isTaskFinished={tools.isTaskFinished}
            taskFailed={tools.taskFailed}
            taskError={tools.taskError}
            shouldBackupAudioFiles={tools.shouldBackupAudioFiles}
            onBackupChange={tools.toggleBackupAudioFiles}
            onStartEmbed={tools.handleEmbedClick}
          />
        ) : (
          <M4bEncodePanel
            tracks={tools.tracks}
            processing={tools.processing}
            progress={tools.progress}
            isTaskFinished={tools.isTaskFinished}
            taskFailed={tools.taskFailed}
            taskError={tools.taskError}
            isCancelingEncode={tools.isCancelingEncode}
            encodeTaskHasEncodingOptions={tools.encodeTaskHasEncodingOptions}
            encodingOptions={tools.encodingOptions}
            onEncodingOptionsChange={tools.handleEncodingOptionsChange}
            onStartEncode={tools.handleEncodeM4bClick}
            onCancelEncode={tools.handleCancelEncodeClick}
          />
        )}

        <ToolsInfoNotes
          selectedTool={tools.selectedTool}
          libraryItemRelPath={tools.libraryItemRelPath}
          libraryItemId={tools.libraryItem.id}
          shouldBackupAudioFiles={tools.shouldBackupAudioFiles}
          trackCount={tools.tracks.length}
        />
      </div>

      <div className="mx-auto w-full max-w-4xl">
        <AudioTracksProgressTable tracks={tools.tracks} audioFilesEncoding={tools.audioFilesEncoding} audioFilesFinished={tools.audioFilesFinished} />
      </div>

      {tools.confirmState && (
        <ConfirmDialog
          isOpen={tools.confirmState.isOpen}
          message={tools.confirmState.message}
          yesButtonText={tools.confirmState.yesButtonText}
          yesButtonClassName={tools.confirmState.yesButtonClassName}
          onClose={() => tools.setConfirmState(null)}
          onConfirm={() => tools.confirmState?.onConfirm()}
        />
      )}

      <LibraryItemEditModal isOpen={tools.isEditModalOpen} libraryItem={tools.libraryItem} onClose={() => tools.setIsEditModalOpen(false)} />
    </div>
  )
}
