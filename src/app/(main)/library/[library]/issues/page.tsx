import BookshelfClient from '../[entityType]/BookshelfClient'

export default function IssuesPage() {
  return (
    <div className="h-full w-full">
      <BookshelfClient entityType="items" />
    </div>
  )
}
