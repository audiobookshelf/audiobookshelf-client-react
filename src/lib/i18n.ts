import { getRequestConfig } from 'next-intl/server'

const languageCodeMap: Record<string, { label: string; dateFnsLocale: string }> = {
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

export function getLanguageCodeOptions() {
  return Object.keys(languageCodeMap).map((code) => {
    return {
      text: languageCodeMap[code].label,
      value: code
    }
  })
}

export default getRequestConfig(async () => {
  const locale = 'en-us'

  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default
  }
})
