import LoadingIndicator from '@/components/ui/LoadingIndicator'

export default function SuspenseFallback() {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingIndicator />
    </div>
  )
}
