'use client'

import { ReactNode } from 'react'
import { mergeClasses } from '@/lib/merge-classes'

interface ComponentExamplesProps {
  title: string
  component?: string
  description?: string
  children: ReactNode
}

export function ComponentExamples({ title, children }: ComponentExamplesProps) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-6 text-gray-400">{title}</h2>
      {children}
    </section>
  )
}

interface ComponentInfoProps {
  component?: string
  description?: string
  children?: React.ReactNode
}

export function ComponentInfo({ component, description, children }: ComponentInfoProps) {
  if (!component && !description) return null
  return (
    <div className="w-full mb-6">
      <div className="bg-gray-800 p-6 rounded-lg">
        <p className="mb-2">
          {component && (
            <>
              <span className="font-bold">Component:</span>
              <code className="bg-gray-700 rounded py-1 px-2">{component}</code>
              <span> - </span>
            </>
          )}
          {description && <span>{description}</span>}
        </p>
        {children}
      </div>
    </div>
  )
}

interface ExampleProps {
  title: string
  children: ReactNode
  className?: string
}

export function Example({ title, children, className }: ExampleProps) {
  return (
    <div className={mergeClasses('bg-bg p-6 rounded-lg border border-gray-500', className)}>
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      {children}
    </div>
  )
}

export function ExamplesBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={mergeClasses('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>{children}</div>
}
