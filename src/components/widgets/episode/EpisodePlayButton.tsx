import Btn from '@/components/ui/Btn'
import { mergeClasses } from '@/lib/merge-classes'

interface EpisodePlayButtonProps {
  label: string
  isPlaying: boolean
  isFinished?: boolean
  onClick: (e: React.MouseEvent) => void
  className?: string
}

export default function EpisodePlayButton({ label, isPlaying, isFinished = false, onClick, className }: EpisodePlayButtonProps) {
  return (
    <Btn
      color="bg-transparent"
      onClick={onClick}
      className={mergeClasses('border-foreground/20 hover:bg-foreground/10 flex-nowrap px-2', isFinished ? 'text-foreground/40' : 'text-foreground', className)}
    >
      <span className={mergeClasses('material-symbols fill text-xl sm:text-2xl', isPlaying ? '' : 'text-success')}>{isPlaying ? 'pause' : 'play_arrow'}</span>
      <span className="pe-1 text-xs font-semibold whitespace-nowrap sm:text-sm">{label}</span>
    </Btn>
  )
}
