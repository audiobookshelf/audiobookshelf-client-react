import { getData, getLibraries } from '@/lib/api'
import UploadClient from './UploadClient'

export const dynamic = 'force-dynamic'

export default async function UploadPage() {
  const [librariesResponse] = await getData(getLibraries())
  const libraries = librariesResponse?.libraries || []
  return <UploadClient libraries={libraries} />
}
