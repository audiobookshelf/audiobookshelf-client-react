export const languageCodeMap: Record<string, { label: string; dateFnsLocale: string }> = {
  ar: { label: 'عربي', dateFnsLocale: 'ar' },
  bg: { label: 'Български', dateFnsLocale: 'bg' },
  bn: { label: 'বাংলা', dateFnsLocale: 'bn' },
  ca: { label: 'Català', dateFnsLocale: 'ca' },
  cs: { label: 'Čeština', dateFnsLocale: 'cs' },
  da: { label: 'Dansk', dateFnsLocale: 'da' },
  de: { label: 'Deutsch', dateFnsLocale: 'de' },
  'en-us': { label: 'English', dateFnsLocale: 'enUS' },
  es: { label: 'Español', dateFnsLocale: 'es' },
  et: { label: 'Eesti', dateFnsLocale: 'et' },
  fi: { label: 'Suomi', dateFnsLocale: 'fi' },
  fr: { label: 'Français', dateFnsLocale: 'fr' },
  he: { label: 'עברית', dateFnsLocale: 'he' },
  hr: { label: 'Hrvatski', dateFnsLocale: 'hr' },
  it: { label: 'Italiano', dateFnsLocale: 'it' },
  lt: { label: 'Lietuvių', dateFnsLocale: 'lt' },
  hu: { label: 'Magyar', dateFnsLocale: 'hu' },
  nl: { label: 'Nederlands', dateFnsLocale: 'nl' },
  no: { label: 'Norsk', dateFnsLocale: 'no' },
  pl: { label: 'Polski', dateFnsLocale: 'pl' },
  'pt-br': { label: 'Português (Brasil)', dateFnsLocale: 'ptBR' },
  ru: { label: 'Русский', dateFnsLocale: 'ru' },
  sl: { label: 'Slovenščina', dateFnsLocale: 'sl' },
  sv: { label: 'Svenska', dateFnsLocale: 'sv' },
  uk: { label: 'Українська', dateFnsLocale: 'uk' },
  'vi-vn': { label: 'Tiếng Việt', dateFnsLocale: 'vi' },
  'zh-cn': { label: '简体中文 (Simplified Chinese)', dateFnsLocale: 'zhCN' },
  'zh-tw': { label: '正體中文 (Traditional Chinese)', dateFnsLocale: 'zhTW' }
}

const SUPPORTED_LANGUAGE_CODES = Object.keys(languageCodeMap)

export function isSupportedLanguageCode(code: string): boolean {
  return code in languageCodeMap
}

/**
 * Best match from an Accept-Language header against supported locale codes.
 * Tries exact tag, then language prefix (de-DE → de), then a regional variant (en → en-us).
 */
export function matchAcceptLanguage(acceptLanguageHeader: string | null | undefined): string | null {
  if (!acceptLanguageHeader) return null

  const preferences = acceptLanguageHeader
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().toLowerCase().split(';')
      const q = parseFloat(params.find((param) => param.trim().startsWith('q='))?.split('=')[1] ?? '1')
      return { tag, q: Number.isFinite(q) ? q : 0 }
    })
    .filter((pref) => pref.tag && pref.tag !== '*')
    .sort((a, b) => b.q - a.q)

  for (const { tag } of preferences) {
    if (isSupportedLanguageCode(tag)) return tag

    const prefix = tag.split('-')[0]
    if (isSupportedLanguageCode(prefix)) return prefix

    const regional = SUPPORTED_LANGUAGE_CODES.find((code) => code.startsWith(`${prefix}-`))
    if (regional) return regional
  }

  return null
}

export function getLanguageCodeOptions() {
  return SUPPORTED_LANGUAGE_CODES.map((code) => {
    return {
      text: languageCodeMap[code].label,
      value: code
    }
  })
}
