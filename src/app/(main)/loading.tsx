import LoadingIndicator from '@/components/ui/LoadingIndicator'

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-var(--header-height))]">
      <LoadingIndicator />
    </div>
  )
}
