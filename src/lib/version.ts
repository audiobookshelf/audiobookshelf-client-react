export interface ReleaseInfo {
  name: string
  total: number
  version: string
  major: number
  minor: number
  patch: number
  preRelease: string | null
  pubdate: Date
  changelog: string
}

export interface VersionData {
  hasUpdate: boolean
  latestVersion: string
  githubTagUrl: string
  currentVersion: string
  releasesToShow: ReleaseInfo[]
}

interface GitHubRelease {
  tag_name: string
  published_at: string
  body: string
}

interface ParsedSemver {
  name: string
  total: number
  version: string
  major: number
  minor: number
  patch: number
  preRelease: string | null
}

function parseSemver(ver: string): ParsedSemver | null {
  if (!ver) return null

  const groups = ver.match(/^v((([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)$/)

  if (groups && groups.length > 6) {
    const total = Number(groups[3]) * 10000 + Number(groups[4]) * 100 + Number(groups[5])
    if (isNaN(total)) {
      console.warn('Invalid version total', groups[3], groups[4], groups[5])
      return null
    }

    return {
      name: ver,
      total,
      version: groups[2],
      major: Number(groups[3]),
      minor: Number(groups[4]),
      patch: Number(groups[5]),
      preRelease: groups[6] || null
    }
  }

  console.warn('Invalid semver string', ver)
  return null
}

async function getReleases(): Promise<ReleaseInfo[]> {
  try {
    const response = await fetch('https://api.github.com/repos/advplyr/audiobookshelf/releases')
    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`)
    }

    const data = (await response.json()) as GitHubRelease[]

    return data
      .map((release) => {
        const verObj = parseSemver(release.tag_name)
        if (!verObj) return null

        return {
          ...verObj,
          pubdate: new Date(release.published_at),
          changelog: release.body
        }
      })
      .filter((release): release is ReleaseInfo => release !== null)
  } catch (error) {
    console.error('Failed to get releases', error)
    return []
  }
}

export async function checkForUpdate(currentVersion: string): Promise<VersionData | null> {
  if (!currentVersion || currentVersion === 'Error') {
    return null
  }

  const releases = await getReleases()
  if (!releases.length) {
    console.error('No releases found')
    return null
  }

  const currentRelease = releases.find((release) => release.version === currentVersion)
  if (!currentRelease) {
    console.error('Current version not found in releases')
    return null
  }

  const latestVersion = releases[0]
  const releasesToShow = releases.filter(
    (release) => release.major === currentRelease.major && release.minor === currentRelease.minor && release.total <= currentRelease.total
  )

  return {
    hasUpdate: latestVersion.total > currentRelease.total,
    latestVersion: latestVersion.version,
    githubTagUrl: `https://github.com/advplyr/audiobookshelf/releases/tag/v${latestVersion.version}`,
    currentVersion: currentRelease.version,
    releasesToShow
  }
}
