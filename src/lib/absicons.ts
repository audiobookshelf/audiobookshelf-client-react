/**
 * Available icon names defined in absicons.css
 * These are all the icon classes that can be used with the absicons font
 */
export const AVAILABLE_ICONS = [
  'audiobookshelf',
  'books-1',
  'microphone-1',
  'radio',
  'podcast',
  'database',
  'microphone-2',
  'headphones',
  'music',
  'video',
  'microphone-3',
  'book-1',
  'books-2',
  'file-picture',
  'database-1',
  'rocket',
  'power',
  'star',
  'heart',
  'rss'
] as const

export type AvailableIcon = typeof AVAILABLE_ICONS[number]

/**
 * Validates if an icon name is available in the absicons font
 */
export function isValidIcon(icon: string): icon is AvailableIcon {
  return AVAILABLE_ICONS.includes(icon as AvailableIcon)
} 