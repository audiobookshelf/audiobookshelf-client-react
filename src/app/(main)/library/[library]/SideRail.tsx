'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { mergeClasses } from '@/lib/merge-classes'

export default function SideRail({
  currentLibraryId,
  currentLibraryMediaType,
  serverVersion,
  installSource
}: {
  currentLibraryId: string
  currentLibraryMediaType: string
  serverVersion: string
  installSource: string
}) {
  const pathname = usePathname()

  const buttons = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      label: 'Home',
      href: `/library/${currentLibraryId}`
    },
    {
      icon: <span className="material-symbols text-2xl">&#xe241;</span>,
      label: 'Latest',
      href: `/library/${currentLibraryId}/latest`,
      mediaType: 'podcast'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
      label: 'Library',
      href: `/library/${currentLibraryId}/bookshelf`
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          />
        </svg>
      ),
      label: 'Series',
      href: `/library/${currentLibraryId}/series`,
      mediaType: 'book'
    },
    {
      icon: <span className="material-symbols text-2xl">&#xe431;</span>,
      label: 'Collections',
      href: `/library/${currentLibraryId}/collections`,
      mediaType: 'book'
    },
    {
      icon: <span className="material-symbols text-2.5xl">&#xe03d;</span>,
      label: 'Playlists',
      href: `/library/${currentLibraryId}/playlists`
    },
    {
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z"
          />
        </svg>
      ),
      label: 'Authors',
      href: `/library/${currentLibraryId}/authors`,
      mediaType: 'book'
    },
    {
      icon: <span className="material-symbols text-2xl">&#xe91f;</span>,
      label: 'Narrators',
      href: `/library/${currentLibraryId}/narrators`,
      mediaType: 'book'
    },
    {
      icon: <span className="material-symbols text-2xl">&#xf190;</span>,
      label: 'Stats',
      href: `/library/${currentLibraryId}/stats`,
      mediaType: 'book'
    },
    {
      icon: <span className="abs-icons icon-podcast text-xl"></span>,
      label: 'Add',
      href: `/library/${currentLibraryId}/search`,
      mediaType: 'podcast'
    },
    {
      icon: <span className="material-symbols text-2xl">&#xf090;</span>,
      label: 'Queue',
      href: `/library/${currentLibraryId}/download-queue`,
      mediaType: 'podcast'
    },
    {
      icon: <span className="material-symbols text-2xl">warning</span>,
      label: 'Issues',
      href: `/library/${currentLibraryId}/issues`,
      hidden: true
    }
  ]

  const filteredButtons = buttons.filter((button) => (!button.mediaType || button.mediaType === currentLibraryMediaType) && !button.hidden)

  return (
    <div className="w-20 min-w-20 h-full max-h-[calc(100vh-4rem)] bg-bg box-shadow-side z-10">
      <div className="w-full h-full max-h-[calc(100%-3rem)] overflow-y-auto">
        {filteredButtons.map((button) => (
          <Link
            key={button.label}
            href={button.href}
            className={mergeClasses(
              'w-full h-20 flex flex-col items-center justify-center text-white border-b border-primary/30 hover:bg-primary/50 cursor-pointer relative',
              pathname === button.href && 'bg-primary/80'
            )}
          >
            {button.icon}
            <p className="text-sm">{button.label}</p>

            {pathname === button.href && <div className="h-full w-0.5 bg-yellow-400 absolute top-0 start-0"></div>}
          </Link>
        ))}
      </div>
      <div className="w-full h-12 px-1 py-2 border-t border-primary/30">
        <p className="text-xs text-center text-gray-300 font-mono">v{serverVersion}</p>
        <p className="text-xxs text-center text-gray-400 italic">{installSource}</p>
      </div>
    </div>
  )
}
