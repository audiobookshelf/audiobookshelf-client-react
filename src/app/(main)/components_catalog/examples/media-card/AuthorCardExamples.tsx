'use client'

import AuthorCard from '@/components/widgets/media-card/AuthorCard'
import AuthorCardSkeleton from '@/components/widgets/media-card/AuthorCardSkeleton'
import { Author } from '@/types/api'
import { useRef, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example } from '../../ComponentExamples'
import { DimensionComparison, Dimensions, useDimensionMeasurement } from './mediaCardExamplesUtils'

interface AuthorCardExamplesProps {
  authorData: Author
}

export function AuthorCardExamples({ authorData }: AuthorCardExamplesProps) {
  // Refs for dimension checking
  const authorCardRef = useRef<HTMLDivElement>(null)
  const authorSkeletonRef = useRef<HTMLDivElement>(null)

  // State for dimensions
  const [authorCardDims, setAuthorCardDims] = useState<Dimensions | null>(null)
  const [authorSkeletonDims, setAuthorSkeletonDims] = useState<Dimensions | null>(null)

  // State for quick match demo
  const [isSearching, setIsSearching] = useState(false)

  // Measure dimensions
  useDimensionMeasurement(
    [
      { ref: authorCardRef, setDims: setAuthorCardDims },
      { ref: authorSkeletonRef, setDims: setAuthorSkeletonDims }
    ],
    [authorData]
  )

  const handleQuickMatch = () => {
    setIsSearching(true)
    // Simulate quick match operation
    setTimeout(() => {
      setIsSearching(false)
    }, 2000)
  }

  return (
    <ComponentExamples title="Author Cards">
      <ComponentInfo
        component="AuthorCard / AuthorCardSkeleton"
        description="Card component for displaying authors. Shows author image or placeholder SVG, name, book count, and hover actions for edit and quick match. Portrait orientation (width = height × 0.8)."
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import AuthorCard from &apos;@/components/widgets/media-card/AuthorCard&apos;</Code>
        </p>
        <div>
          <span className="font-bold">Props:</span>
          <ul className="list-disc list-inside">
            <li>
              <Code>author</Code>: Author - The author to display
            </li>
            <li>
              <Code>sizeMultiplier</Code>?: number - Size multiplier for responsive sizing
            </li>
            <li>
              <Code>userCanUpdate</Code>?: boolean - Show edit/quick match buttons
            </li>
            <li>
              <Code>isSearching</Code>?: boolean - Show loading spinner (Quick Match in progress)
            </li>
            <li>
              <Code>onEdit</Code>?: (author: Author) =&gt; void - Edit callback
            </li>
            <li>
              <Code>onQuickMatch</Code>?: (author: Author) =&gt; void - Quick match callback
            </li>
          </ul>
        </div>
      </ComponentInfo>

      <h3 id="author-card-examples" className="text-lg font-bold mb-4">
        Author: {authorData.name}
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Example title="Default View">
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">With Data</p>
              <div ref={authorCardRef}>
                <AuthorCard
                  author={authorData}
                  userCanUpdate={true}
                  onEdit={(author) => console.log('Edit author:', author)}
                  onQuickMatch={(author) => console.log('Quick match author:', author)}
                />
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Loading Skeleton</p>
              <div ref={authorSkeletonRef}>
                <AuthorCardSkeleton />
              </div>
            </div>
          </div>
          <DimensionComparison cardDimensions={authorCardDims} skeletonDimensions={authorSkeletonDims} />
        </Example>

        <Example title="Quick Match Loading State">
          <div className="flex gap-4 flex-wrap items-start">
            <div>
              <p className="text-sm text-gray-400 mb-2">Click Quick Match button to see loading</p>
              <AuthorCard
                author={authorData}
                userCanUpdate={true}
                isSearching={isSearching}
                onQuickMatch={handleQuickMatch}
              />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Static Loading State</p>
              <AuthorCard
                author={authorData}
                isSearching={true}
              />
            </div>
          </div>
        </Example>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Example title="No Image (Placeholder)">
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">With placeholder SVG</p>
              <AuthorCard
                author={{ ...authorData, imagePath: undefined }}
                userCanUpdate={true}
              />
            </div>
          </div>
        </Example>

        <Example title="Read-Only (No Update Permission)">
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">No hover buttons</p>
              <AuthorCard
                author={authorData}
                userCanUpdate={false}
              />
            </div>
          </div>
        </Example>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Example title="Selection Mode">
          <div className="flex gap-4 flex-wrap">
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Selection Mode (Unselected)</p>
              <AuthorCard
                author={authorData}
                isSelectionMode={true}
                selected={false}
                onSelect={(e) => console.log('Toggle selection', e)}
              />
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Selection Mode (Selected)</p>
              <AuthorCard
                author={authorData}
                isSelectionMode={true}
                selected={true}
                onSelect={(e) => console.log('Toggle selection', e)}
              />
            </div>
          </div>
        </Example>
      </div>

      <div className="mb-6">
        <Example title="Size Multipliers">
          <div className="flex gap-8 flex-wrap items-start pb-6">
            <div style={{ fontSize: `${1 / 2}em` }} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Size: 1/2</p>
              <AuthorCard
                author={authorData}
                sizeMultiplier={1 / 2}
                userCanUpdate={true}
              />
            </div>
            <div style={{ fontSize: `${3 / 4}em` }} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Size: 3/4</p>
              <AuthorCard
                author={authorData}
                sizeMultiplier={3 / 4}
                userCanUpdate={true}
              />
            </div>
            <div style={{ fontSize: `${5 / 6}em` }} className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Size: 5/6</p>
              <AuthorCard
                author={authorData}
                sizeMultiplier={5 / 6}
                userCanUpdate={true}
              />
            </div>
            <div style={{ fontSize: `${1}em` }} className="mb-6 hidden lg:block">
              <p className="text-sm text-gray-400 mb-2">Size: 1</p>
              <AuthorCard
                author={authorData}
                sizeMultiplier={1}
                userCanUpdate={true}
              />
            </div>
            <div className="hidden lg:block mb-6" style={{ fontSize: `${4 / 3}em` }}>
              <p className="text-sm text-gray-400 mb-2">Size: 4/3</p>
              <AuthorCard
                author={authorData}
                sizeMultiplier={4 / 3}
                userCanUpdate={true}
              />
            </div>
          </div>
        </Example>
      </div>
    </ComponentExamples>
  )
}
