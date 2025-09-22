import { getCurrentUser } from '@/lib/api'

export const dynamic = 'force-dynamic'

export default async function UploadPage() {
  const userResponse = await getCurrentUser()
  const user = userResponse.data?.user

  if (!user) {
    return null
  }

  return (
    <div className="p-8 w-full max-w-xl mx-auto">
      <h1 className="text-2xl">Upload</h1>
    </div>
  )
}
