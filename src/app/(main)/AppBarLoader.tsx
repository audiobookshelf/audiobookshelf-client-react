import { getData, getLibraries } from '@/lib/api'
import AppBar from './AppBar'

interface AppBarLoaderProps {
  currentLibraryId?: string
}

export default async function AppBarLoader({ currentLibraryId }: AppBarLoaderProps) {
  const [librariesResponse] = await getData(getLibraries())

  return <AppBar libraries={librariesResponse?.libraries} currentLibraryId={currentLibraryId} />
}
