import { useLibrary } from '@/contexts/LibraryContext'
import { filterEncode } from '@/lib/filterUtils'
import { useMemo } from 'react'

export function useSeriesBooksQuery(seriesId: string): string {
  const { collapseBookSeries } = useLibrary()

  return useMemo(() => {
    const params = new URLSearchParams()
    params.set('filter', `series.${filterEncode(seriesId)}`)
    if (collapseBookSeries) {
      params.set('collapseseries', '1')
    }

    return params.toString()
  }, [seriesId, collapseBookSeries])
}
