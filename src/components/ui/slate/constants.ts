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
