import { getData, getLibraries } from '../../../../lib/api'
import LibrariesClient from './LibrariesClient'

export const dynamic = 'force-dynamic'

export default async function LibrariesPage() {
  const [librariesResponse] = await getData(getLibraries())
  const libraries = librariesResponse?.libraries || []

  return <LibrariesClient libraries={libraries} />
}
