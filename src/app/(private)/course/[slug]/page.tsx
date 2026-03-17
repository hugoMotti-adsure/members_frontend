import { WatchCourseClient } from './watch-course-client'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function WatchCoursePage({ params }: PageProps) {
  const { slug } = await params
  return <WatchCourseClient slug={slug} />
}
