'use client'

import AuthorImage from '@/components/covers/AuthorImage'
import IconBtn from '@/components/ui/IconBtn'
import { useLibrary } from '@/contexts/LibraryContext'
import { Author, UserLoginResponse } from '@/types/api'

interface AuthorClientProps {
  author: Author
  currentUser: UserLoginResponse
}

/* eslint-disable @typescript-eslint/no-unused-vars */
export default function AuthorClient({ author, currentUser }: AuthorClientProps) {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const { library } = useLibrary()

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
          <div className="text-sm font-medium text-foreground-subdued uppercase mb-2">Description</div>
          {author.description && <p className="text-base text-foreground" dangerouslySetInnerHTML={{ __html: author.description }} />}
        </div>
      </div>
    </div>
  )
}
