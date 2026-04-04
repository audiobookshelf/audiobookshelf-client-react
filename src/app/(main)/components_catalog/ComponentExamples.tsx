'use client'

import { mergeClasses } from '@/lib/merge-classes'
import { ReactNode } from 'react'

interface ComponentExamplesProps {
  title: string
  component?: string
  description?: string
  children: ReactNode
}

export function ComponentExamples({ title, children }: ComponentExamplesProps) {
  return (
    <section className="mb-12">
      <h2 className="mb-6 text-2xl font-semibold text-gray-400">{title}</h2>
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
    <div className="mb-6 w-full">
      <div className="rounded-lg bg-gray-800 p-6">
        <p className="mb-2">
          {component && (
            <>
              <span className="font-bold">Component:</span>
              <Code>{component}</Code>
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
    <div className={mergeClasses('bg-bg rounded-lg border border-gray-500 p-6', className)}>
      <h3 className="mb-4 text-lg font-medium">{title}</h3>
      {children}
    </div>
  )
}

export function ExamplesBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={mergeClasses('grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3', className)}>{children}</div>
}

interface CodeProps {
  children: ReactNode
  overflow?: boolean
  className?: string
}

export function Code({ children, overflow = false, className }: CodeProps) {
  return <code className={mergeClasses('rounded bg-gray-700 px-2 py-1', overflow && 'block max-w-full overflow-x-auto', className)}>{children}</code>
}
