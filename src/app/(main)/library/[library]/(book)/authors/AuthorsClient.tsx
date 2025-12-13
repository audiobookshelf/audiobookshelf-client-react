'use client'

import { AuthorCard } from '@/components/widgets/media-card/AuthorCard'
import { GetAuthorsResponse, UserLoginResponse } from '@/types/api'

interface AuthorsClientProps {
  authorsData: GetAuthorsResponse
  currentUser: UserLoginResponse
}

export default function AuthorsClient({ authorsData, currentUser }: AuthorsClientProps) {
  const authors = authorsData.authors
  const user = currentUser.user

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {authors.map((author) => {
          return <AuthorCard key={author.id} author={author} userCanUpdate={user.permissions.update} />
        })}
      </div>
    </div>
  )
}
