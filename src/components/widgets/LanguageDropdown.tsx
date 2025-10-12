import { getLanguageCodeOptions } from '@/lib/i18n'
import Dropdown from '../ui/Dropdown'

interface LanguageDropdownProps {
  value: string
  onChange: (value: string) => void
}

export default function LanguageDropdown(props: LanguageDropdownProps) {
  const { value, onChange } = props
  const languageOptions = getLanguageCodeOptions()

  return <Dropdown value={value} items={languageOptions} label="Language" onChange={(value: string | number) => onChange(value as string)} />
}
