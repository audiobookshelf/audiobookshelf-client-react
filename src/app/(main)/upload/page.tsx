import { getCurrentUser } from '@/lib/api'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'

export const dynamic = 'force-dynamic'

export default async function UploadPage() {
  const t = await getTypeSafeTranslations()
  const userResponse = await getCurrentUser()
  const user = userResponse.data?.user

  if (!user) {
    return null
  }

  return (
    <div className="p-8 w-full max-w-xl mx-auto">
      <h1 className="text-2xl">{t('HeaderUpload')}</h1>
    </div>
  )
}
