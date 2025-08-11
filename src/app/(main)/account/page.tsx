import TextInput from '@/components/ui/TextInput'
import Dropdown from '@/components/ui/Dropdown'

import { getCurrentUser } from '@/lib/api'
import { getLanguageCodeOptions } from '@/lib/i18n'

import LogoutBtn from './LogoutBtn'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const userResponse = await getCurrentUser()
  const user = userResponse.data?.user

  const languageOptions = getLanguageCodeOptions()

  if (!user) {
    return null
  }

  return (
    <div className="p-8 w-full max-w-xl mx-auto">
      <h1 className="text-2xl">Account</h1>

      <div className="flex flex-col items-start gap-4 mt-8">
        <div className="flex items-center gap-2 w-full">
          <div className="flex-2">
            <TextInput value={user.username} label="Username" readOnly />
          </div>
          <div className="flex-1">
            <TextInput value={user.type} label="Account Type" readOnly />
          </div>
        </div>
        <div className="w-full">
          <Dropdown value={'en-us'} items={languageOptions} label="Language" />
        </div>
        <div className="w-full h-px bg-border" />
        <LogoutBtn />
      </div>
    </div>
  )
}
