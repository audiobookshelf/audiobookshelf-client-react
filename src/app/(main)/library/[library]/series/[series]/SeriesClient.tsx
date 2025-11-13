import { Library, Series, UserLoginResponse } from '@/types/api'

interface SeriesClientProps {
  series: Series
  currentUser: UserLoginResponse
  library: Library
}

export default function SeriesClient({ series, currentUser, library }: SeriesClientProps) {
  return (
    <div>
      <div className="w-full max-w-6xl mx-auto space-y-4">
        <div className="bg-black p-2 rounded border">
          <pre className="text-sm whitespace-pre-wrap overflow-x-auto">{JSON.stringify(series, null, 2)}</pre>
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
