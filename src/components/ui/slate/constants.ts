import { mergeClasses } from '@/lib/merge-classes'

/**
 * Shared button class base for RTE toolbar buttons
 * Used across Block, Mark, Link, and History components
 */
export const buttonClassBase = mergeClasses(
  'first:border-s-0 first:rounded-s-sm first:rounded-e-none last:rounded-e-sm last:rounded-s-none [&:not(:first-child):not(:last-child)]:rounded-none',
  'focus-visible:-outline-offset-1',
  'h-7'
)

export const slateElementStyles = mergeClasses(
  '[&_ul]:list-disc [&_ul]:list-outside',
  '[&_ol]:list-decimal [&_ol]:list-outside',
  '[&_li]:text-start [&_li]:ms-4',
  '[&_a]:text-blue-500 [&_a]:hover:underline [&_a]:hover:text-blue-400',
  '[&>*:not(:last-child)]:mb-1.5'
)
