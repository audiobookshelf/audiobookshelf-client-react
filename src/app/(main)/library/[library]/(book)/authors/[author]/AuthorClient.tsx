'use client'

import AuthorImage from '@/components/covers/AuthorImage'
import IconBtn from '@/components/ui/IconBtn'
import ItemSlider from '@/components/widgets/ItemSlider'
import BookMediaCard from '@/components/widgets/media-card/BookMediaCard'
import { useLibrary } from '@/contexts/LibraryContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { Author, BookshelfView, UserLoginResponse } from '@/types/api'

interface AuthorClientProps {
  author: Author
  currentUser: UserLoginResponse
}

export default function AuthorClient({ author, currentUser }: AuthorClientProps) {
  const t = useTypeSafeTranslations()
  const { library, showSubtitles } = useLibrary()

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex gap-8">
        <div className="w-48 max-w-48">
          <div className="w-full h-60">
            <AuthorImage author={author} className="w-full h-full" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-8">
            <h1 className="text-2xl">{author.name}</h1>
            <IconBtn
              borderless
              size="small"
              // todo add this affect to icon btn?
              iconClass="hover:text-warning hover:scale-120 transition-colors transition-transform duration-100"
              onClick={() => {}}
            >
              edit
            </IconBtn>
          </div>
          <div className="text-sm font-medium text-foreground-subdued uppercase mb-2">{t('LabelDescription')}</div>
          {author.description && <p className="text-base text-foreground" dangerouslySetInnerHTML={{ __html: author.description }} />}
        </div>
      </div>
      <div className="mt-20 -ms-2e">
        <ItemSlider title={t('LabelXItems', { 0: author.libraryItems?.length ?? 0 })} className="!ps-0">
          {author.libraryItems?.map((libraryItem) => {
            const mediaProgress = currentUser.user.mediaProgress.find((progress) => progress.libraryItemId === libraryItem.id)
            return (
              <div key={libraryItem.id} className="shrink-0 mx-2e">
                <BookMediaCard
                  libraryItem={libraryItem}
                  bookshelfView={BookshelfView.DETAIL}
                  dateFormat={currentUser.serverSettings?.dateFormat ?? 'MM/dd/yyyy'}
                  timeFormat={currentUser.serverSettings?.timeFormat ?? 'HH:mm'}
                  userPermissions={currentUser.user.permissions}
                  ereaderDevices={currentUser.ereaderDevices}
                  showSubtitles={showSubtitles}
                  bookCoverAspectRatio={library?.settings?.coverAspectRatio ?? 1}
                  mediaProgress={mediaProgress}
                />
              </div>
            )
          })}
        </ItemSlider>
      </div>
    </div>
  )
}
