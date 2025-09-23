import SettingsContent from '../SettingsContent'
import { getLibraries, getData } from '../../../../lib/api'
import LibrariesList from './LibrariesList'

export const dynamic = 'force-dynamic'

export default async function LibrariesPage() {
  const [librariesResponse] = await getData(getLibraries())

  const librariesData = librariesResponse.data?.libraries || []

  return (
    <SettingsContent title="Libraries" moreInfoUrl="https://www.audiobookshelf.org/guides/library_creation">
      <LibrariesList libraries={librariesData} />
    </SettingsContent>
  )
}
