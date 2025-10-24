'use client'

import { getCurrentUserAction } from '@/app/actions/searchActions'
import CoverEdit from '@/components/widgets/CoverEdit'
import { BookLibraryItem, PodcastLibraryItem, User } from '@/types/api'
import { useEffect, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example } from '../ComponentExamples'

interface CoverEditExamplesProps {
  selectedLibraryItem?: BookLibraryItem | PodcastLibraryItem
}

export function CoverEditExamples({ selectedLibraryItem }: CoverEditExamplesProps) {
  // Data fetching state
  const [user, setUser] = useState<User | null>(null)
  const [bookCoverAspectRatio, setBookCoverAspectRatio] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Fetch user data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const currentUser = await getCurrentUserAction()

        if (currentUser?.user) {
          setUser(currentUser.user)
          setBookCoverAspectRatio(currentUser.serverSettings.bookshelfView || 1)
        } else {
          setLoadError('No user data received')
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Failed to load user data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Show loading state
  if (isLoading) {
    return (
      <ComponentExamples title="Cover Tab Component">
        <div className="p-8 text-center">
          <p className="text-gray-400">Loading user data...</p>
        </div>
      </ComponentExamples>
    )
  }

  // Show error state
  if (loadError) {
    return (
      <ComponentExamples title="Cover Tab Component">
        <div className="p-8 border-2 border-error rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-error">Error Loading Data</h3>
          <p className="text-gray-400">{loadError}</p>
        </div>
      </ComponentExamples>
    )
  }

  // Show message if no user
  if (!user) {
    return (
      <ComponentExamples title="Cover Tab Component">
        <div className="p-8 border-2 border-dashed border-gray-600 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Cover Tab Component</h3>
          <p className="text-gray-400">You must be logged in to view this example.</p>
        </div>
      </ComponentExamples>
    )
  }

  return (
    <ComponentExamples title="Cover Edit">
      <ComponentInfo
        component="CoverEdit"
        description="A comprehensive cover management component for library items. Supports uploading covers, searching from multiple providers, managing local covers, and cover URL submission. Cover providers are automatically loaded from the global MetadataContext based on the media type. Processing state is managed internally using React transitions."
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import CoverEdit from &apos;@/components/widgets/CoverEdit&apos;</Code>
        </p>
        <div>
          <span className="font-bold">Props:</span>
          <ul className="list-disc list-inside">
            <li>
              <Code>libraryItem</Code>: The library item to manage covers for.
            </li>
            <li>
              <Code>user</Code>: Current user with permissions.
            </li>
            <li>
              <Code>bookCoverAspectRatio</Code>: Aspect ratio for book covers.
            </li>
          </ul>
        </div>
      </ComponentInfo>

      <Example title={`Cover Edit for: ${selectedLibraryItem?.media.metadata.title}`}>
        {/* Cover Component Display */}
        {selectedLibraryItem ? (
          <div style={{ height: '600px' }}>
            <CoverEdit libraryItem={selectedLibraryItem} user={user} bookCoverAspectRatio={bookCoverAspectRatio} />
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-primary/20 rounded-lg">
            <p className="text-gray-400 mb-2">No book selected</p>
            <p className="text-sm text-gray-500">Use the search box above to select a book and see the Cover component in action with real data</p>
          </div>
        )}
      </Example>
    </ComponentExamples>
  )
}
