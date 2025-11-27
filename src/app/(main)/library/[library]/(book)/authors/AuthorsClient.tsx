'use client'

import { GetAuthorsResponse } from '@/types/api'

interface AuthorsClientProps {
  authors: GetAuthorsResponse
}

export default function AuthorsClient({ authors }: AuthorsClientProps) {
  return (
    <div>
      <div className="mb-6 p-4 bg-primary rounded-lg">
        <pre className="text-sm bg-black p-2 rounded border whitespace-pre-wrap overflow-x-auto">{JSON.stringify(authors, null, 2)}</pre>
      </div>
    </div>
  )
}
