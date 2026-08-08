import type { TranslationKey } from '@/types/translations'

export const dateFormatOptions: { text: string; value: string }[] = [
  { text: 'MM/DD/YYYY', value: 'MM/dd/yyyy' }, // i18n-ignore
  { text: 'DD/MM/YYYY', value: 'dd/MM/yyyy' }, // i18n-ignore
  { text: 'DD.MM.YYYY', value: 'dd.MM.yyyy' }, // i18n-ignore
  { text: 'YYYY-MM-DD', value: 'yyyy-MM-dd' }, // i18n-ignore
  { text: 'MMM do, yyyy', value: 'MMM do, yyyy' }, // i18n-ignore
  { text: 'MMMM do, yyyy', value: 'MMMM do, yyyy' }, // i18n-ignore
  { text: 'dd MMM yyyy', value: 'dd MMM yyyy' }, // i18n-ignore
  { text: 'dd MMMM yyyy', value: 'dd MMMM yyyy' } // i18n-ignore
]

export const timeFormatOptions: { labelKey: TranslationKey; value: string }[] = [
  { labelKey: 'LabelTimeFormatHmmaAmPm', value: 'h:mma' },
  { labelKey: 'LabelTimeFormatHHmm24Hour', value: 'HH:mm' }
]
