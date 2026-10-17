import type { DropdownItem } from '@/components/ui/Dropdown'

/** iTunes search API ISO 3166 country codes */
export const podcastSearchRegionMap: Record<string, { label: string }> = {
  au: { label: 'Australia' },
  br: { label: 'Brasil' },
  be: { label: 'België / Belgique / Belgien' },
  by: { label: 'Беларусь' },
  cz: { label: 'Česko' },
  dk: { label: 'Danmark' },
  de: { label: 'Deutschland' },
  ee: { label: 'Eesti' },
  es: { label: 'España / Espanya / Espainia' },
  fr: { label: 'France' },
  hr: { label: 'Hrvatska' },
  il: { label: 'ישראל / إسرائيل' },
  it: { label: 'Italia' },
  lu: { label: 'Luxembourg / Luxemburg / Lëtezebuerg' },
  hu: { label: 'Magyarország' },
  nl: { label: 'Nederland' },
  no: { label: 'Norge' },
  nz: { label: 'New Zealand' },
  at: { label: 'Österreich' },
  pl: { label: 'Polska' },
  pt: { label: 'Portugal' },
  ru: { label: 'Россия' },
  ch: { label: 'Schweiz / Suisse / Svizzera' },
  sk: { label: 'Slovensko' },
  se: { label: 'Sverige' },
  vn: { label: 'Việt Nam' },
  ua: { label: 'Україна' },
  gb: { label: 'United Kingdom' },
  us: { label: 'United States' },
  cn: { label: '中国' }
}

export const podcastSearchRegionOptions: DropdownItem[] = Object.entries(podcastSearchRegionMap).map(([value, { label }]) => ({
  value,
  text: label
}))
