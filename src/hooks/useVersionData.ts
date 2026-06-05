'use client'

import { checkForUpdate, type VersionData } from '@/lib/version'
import { useEffect, useState } from 'react'

// How version/update data is managed:
// - Fetches GitHub releases via checkForUpdate()
// - Caches the result in localStorage so we don't hit the API on every page load
// - Re-checks at most once every 5 minutes (based on VersionFooter being mounted)
// - Used by VersionFooter for the changelog modal and "Update available" link

const VERSION_CHECK_BUFF = 1000 * 60 * 5

// pubdate is serialized as a string in localStorage
function reviveVersionData(data: VersionData): VersionData {
  return {
    ...data,
    releasesToShow: data.releasesToShow.map((release) => ({
      ...release,
      pubdate: new Date(release.pubdate)
    }))
  }
}

function loadSavedVersionData(): VersionData | null {
  if (typeof window === 'undefined') return null

  const savedVersionData = localStorage.getItem('versionData')
  if (!savedVersionData) return null

  try {
    return JSON.parse(savedVersionData) as VersionData
  } catch (error) {
    console.error('Failed to parse version data', error)
    localStorage.removeItem('versionData')
    return null
  }
}

export function useVersionData(currentVersion: string) {
  // Hydrate from cache on first render so the changelog can open immediately
  const [versionData, setVersionData] = useState<VersionData | null>(() => {
    const saved = loadSavedVersionData()
    if (saved?.currentVersion === currentVersion && saved.releasesToShow?.length) {
      return reviveVersionData(saved)
    }
    return null
  })

  useEffect(() => {
    if (!currentVersion || currentVersion === 'Error') return

    const lastVerCheck = Number(localStorage.getItem('lastVerCheck') || 0)
    const savedVersionData = loadSavedVersionData()

    // Skip the API call if cache is fresh and still matches the running version
    let shouldCheckForUpdate = Date.now() - lastVerCheck > VERSION_CHECK_BUFF
    if (!shouldCheckForUpdate && savedVersionData && (savedVersionData.currentVersion !== currentVersion || !savedVersionData.releasesToShow?.length)) {
      shouldCheckForUpdate = true
    }

    if (!shouldCheckForUpdate && savedVersionData) {
      setVersionData(reviveVersionData(savedVersionData))
      return
    }

    let cancelled = false

    // Fetch from GitHub, then persist to localStorage (keys: versionData, lastVerCheck)
    checkForUpdate(currentVersion)
      .then((result) => {
        if (cancelled || !result) return

        localStorage.setItem('lastVerCheck', String(Date.now()))
        localStorage.setItem('versionData', JSON.stringify(result))
        setVersionData(result)
      })
      .catch((error) => {
        console.error('Update check failed', error)
      })

    return () => {
      cancelled = true
    }
  }, [currentVersion])

  return versionData
}
