import { getLanguageCodeOptions } from '@/lib/languages'
import Dropdown from '../ui/Dropdown'

interface LanguageDropdownProps {
  value: string
  onChange: (value: string) => void
  label?: string
  disabled?: boolean
}

export default function LanguageDropdown(props: LanguageDropdownProps) {
  const { value, onChange, label = 'Language', disabled } = props
  const languageOptions = getLanguageCodeOptions()

  return <Dropdown value={value} items={languageOptions} label={label} disabled={disabled} onChange={(value: string | number) => onChange(value as string)} />
}
