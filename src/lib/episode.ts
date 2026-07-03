import type { PodcastEpisode } from '@/types/api'

/** Shared icon-button sizing for episode row listen actions (latest, table, compilation rows). */
export const EPISODE_ROW_ACTION_BTN_CLASS =
  'size-[1.75em] min-h-0 min-w-0 shrink-0 p-0 text-[1.5em] leading-none hover:not-disabled:before:bg-foreground/10'

/** Strip interactive behavior from anchor tags in episode HTML descriptions for row display. */
export function sanitizeEpisodeDescriptionHtml(description: string): string {
  return description.replace(/<a\b/gi, '<a tabindex="-1" style="pointer-events:none"')
}

export function getEpisodeDuration(episode: PodcastEpisode): number {
  const d = episode.audioFile?.duration ?? episode.audioTrack?.duration
  return typeof d === 'number' && Number.isFinite(d) ? d : 0
}
