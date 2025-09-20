import SettingsContent from '../SettingsContent'
import { getLibraries, getData } from '../../../../lib/api'

export const dynamic = 'force-dynamic'

export default async function LibrariesPage() {
  const [librariesResponse] = await getData(getLibraries())

  const libraries = librariesResponse.data?.libraries || []

  return (
    <SettingsContent title="Libraries" moreInfoUrl="https://www.audiobookshelf.org/guides/library_creation">
      <div className="flex flex-col gap-2 py-4">
        {libraries.map((library: any) => (
          <div key={library.id}>{library.name}</div>
        ))}
      </div>
    </SettingsContent>
  )
}
