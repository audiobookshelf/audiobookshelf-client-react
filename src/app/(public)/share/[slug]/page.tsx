import SharePlayer from './SharePlayer'

interface SharePageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ t?: string }>
}

export default async function SharePage({ params, searchParams }: SharePageProps) {
  const { slug } = await params
  const { t } = await searchParams
  const startTime = t && !isNaN(Number(t)) ? Number(t) : undefined

  return <SharePlayer slug={slug} startTime={startTime} />
}
