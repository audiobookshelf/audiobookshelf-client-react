'use client'

import { useLibrary } from '@/contexts/LibraryContext'
import { Author, UserLoginResponse } from '@/types/api'

interface AuthorClientProps {
  author: Author
  currentUser: UserLoginResponse
}

export default function AuthorClient({ author, currentUser }: AuthorClientProps) {
  const { library } = useLibrary()

  return (
    <div>
      <div className="w-full max-w-6xl mx-auto space-y-4">
        <div className="bg-black p-2 rounded border">
          <pre className="text-sm whitespace-pre-wrap overflow-x-auto">{JSON.stringify(author, null, 2)}</pre>
        </div>
        <div className="bg-black p-2 rounded border">
          <pre className="text-sm whitespace-pre-wrap overflow-x-auto">{JSON.stringify(library, null, 2)}</pre>
        </div>
        <div className="bg-black p-2 rounded border">
          <pre className="text-sm whitespace-pre-wrap overflow-x-auto">{JSON.stringify(currentUser, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}
