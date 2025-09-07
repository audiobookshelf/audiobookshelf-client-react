import SettingsContent from '../SettingsContent'
import { getLibraries } from '../../../../lib/api'

export default async function LibrariesPage() {
  const librariesResponse = await getLibraries()

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
