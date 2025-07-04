import { getCurrentUser } from '../../../lib/api'

export default async function ConfigPage() {
  const userResponse = await getCurrentUser()
  const user = userResponse.data?.user

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold">Config</h1>
    </div>
  )
}
