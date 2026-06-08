import type { FoliateViewElement } from '@/components/ereader/foliate'
import { usesPageBasedProgress } from '@/lib/ereader/ereaderEbook'

export type EreaderTheme = 'dark' | 'light' | 'sepia'
export type EreaderFont = 'serif' | 'sans-serif'
export type EreaderSpread = 'none' | 'auto'

export interface EreaderSettings {
  theme: EreaderTheme
  font: EreaderFont
  fontScale: number
  lineSpacing: number
  textStroke: number
  spread: EreaderSpread
}

export const DEFAULT_EREADER_SETTINGS: EreaderSettings = {
  theme: 'dark',
  font: 'serif',
  fontScale: 100,
  lineSpacing: 115,
  textStroke: 0,
  spread: 'auto'
}

const STORAGE_KEY = 'ereaderSettings'

export function loadEreaderSettings(): EreaderSettings {
  if (typeof window === 'undefined') return DEFAULT_EREADER_SETTINGS

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_EREADER_SETTINGS

    const parsed = JSON.parse(stored) as Partial<EreaderSettings>
    return { ...DEFAULT_EREADER_SETTINGS, ...parsed }
  } catch (error) {
    console.error('Failed to load ereader settings', error)
    return DEFAULT_EREADER_SETTINGS
  }
}

export function saveEreaderSettings(settings: EreaderSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save ereader settings', error)
  }
}

export function supportsReflowableSettings(ebookFormat: string): boolean {
  return !usesPageBasedProgress(ebookFormat)
}

export function getThemeColors(theme: EreaderTheme): { background: string; color: string } {
  switch (theme) {
    case 'sepia':
      return { background: 'rgb(244, 236, 216)', color: '#5b4636' }
    case 'light':
      return { background: 'rgb(255, 255, 255)', color: '#000000' }
    default:
      return { background: 'rgb(35, 35, 35)', color: '#ffffff' }
  }
}

export const EREADER_THEME_SHELL_CLASS: Record<EreaderTheme, string> = {
  dark: 'bg-primary text-white',
  light: 'bg-white text-black',
  sepia: 'bg-[rgb(244,236,216)] text-[#5b4636]'
}

export interface EreaderSearchInputClassNames {
  wrapperClassName: string
  customInputClass: string
  clearButtonClassName: string
}

/** Theme-aware TextInput classes for the ereader TOC search field */
export const EREADER_THEME_SEARCH_INPUT: Record<EreaderTheme, EreaderSearchInputClassNames> = {
  dark: {
    wrapperClassName: 'h-8 border-white/20 bg-white/10 text-inherit has-[:focus-visible]:outline-white/30',
    customInputClass: 'text-inherit placeholder:text-white/50',
    clearButtonClassName: 'text-inherit opacity-60 hover:text-inherit hover:opacity-100 focus:ring-white/30'
  },
  light: {
    wrapperClassName: 'h-8 border-black/15 bg-black/5 text-inherit has-[:focus-visible]:outline-black/25',
    customInputClass: 'text-inherit placeholder:text-black/40',
    clearButtonClassName: 'text-inherit opacity-60 hover:text-inherit hover:opacity-100 focus:ring-black/25'
  },
  sepia: {
    wrapperClassName: 'h-8 border-[#5b4636]/25 bg-black/5 text-inherit has-[:focus-visible]:outline-[#5b4636]/30',
    customInputClass: 'text-inherit placeholder:text-[#5b4636]/50',
    clearButtonClassName: 'text-inherit opacity-60 hover:text-inherit hover:opacity-100 focus:ring-[#5b4636]/30'
  }
}

/** User stylesheet injected into foliate section iframes (after the book's own CSS) */
export function buildFoliateUserStyles(settings: EreaderSettings): string {
  const { background, color } = getThemeColors(settings.theme)
  const lineSpacing = settings.lineSpacing / 100
  const fontScale = settings.fontScale / 100
  const textStroke = settings.textStroke / 100

  return `
@namespace epub "http://www.idpf.org/2007/ops";
html, body {
  background-color: ${background} !important;
}
body {
  font-family: ${settings.font};
  font-size: ${fontScale * 100}%;
}
* {
  color: ${color} !important;
  line-height: ${lineSpacing * fontScale}rem !important;
  -webkit-text-stroke: ${textStroke}px ${color} !important;
}
a, a:link, a:visited {
  color: ${color} !important;
}
[align="left"] { text-align: left; }
[align="right"] { text-align: right; }
[align="center"] { text-align: center; }
[align="justify"] { text-align: justify; }
pre {
  white-space: pre-wrap !important;
}
aside[epub|type~="endnote"],
aside[epub|type~="footnote"],
aside[epub|type~="note"],
aside[epub|type~="rearnote"] {
  display: none;
}
`.trim()
}

export function applyEreaderSettingsToView(view: FoliateViewElement, settings: EreaderSettings, ebookFormat: string): void {
  const renderer = view.renderer as FoliateViewElement['renderer'] | undefined
  if (!renderer?.setStyles) return

  if (supportsReflowableSettings(ebookFormat)) {
    renderer.setStyles(buildFoliateUserStyles(settings))
    renderer.setAttribute('max-column-count', settings.spread === 'none' ? '1' : '2')
  }
}
