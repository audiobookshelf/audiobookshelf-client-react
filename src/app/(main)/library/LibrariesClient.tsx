'use client'

import Link from 'next/link'

interface LibrariesClientProps {
  libraries: any[]
}
export default function LibrariesClient({ libraries }: LibrariesClientProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {libraries.map((library) => (
        <Link href={`/library/${library.id}`} key={library.id} className="bg-primary rounded-lg p-4 text-white">
          {library.name}
        </Link>
      ))}
    </div>
  )
}
