'use client'

interface LibraryClientProps {
  library: any
}

export default function LibraryClient({ library }: LibraryClientProps) {
  return (
    <div>
      <div className="mb-6 p-4 bg-primary rounded-lg">
        <h2 className="text-2xl font-semibold mb-2">{library.name}</h2>
        <pre className="text-sm bg-black p-2 rounded border">{JSON.stringify(library, null, 2)}</pre>
      </div>
    </div>
  )
}
