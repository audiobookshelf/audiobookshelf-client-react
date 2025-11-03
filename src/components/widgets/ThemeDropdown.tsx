import { useTranslations } from 'next-intl'
import Dropdown from '../ui/Dropdown'

interface ThemeDropdownProps {
  value: string
  onChange: (value: string) => void
  label?: string
  disabled?: boolean
}

export default function ThemeDropdown(props: ThemeDropdownProps) {
  const { value, onChange, label, disabled } = props
  const t = useTranslations()

  const themeOptions = [
    { text: t('LabelThemeDark'), value: 'dark' },
    { text: t('LabelThemeLight'), value: 'light' },
    { text: t('LabelThemeBlack'), value: 'black' }
  ]

  return (
    <Dropdown
      value={value}
      items={themeOptions}
      label={label || t('LabelTheme')}
      disabled={disabled}
      onChange={(value: string | number) => onChange(value as string)}
    />
  )
}
