import { LayoutClient } from './layout-client'

export default function CourseWatchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <LayoutClient>{children}</LayoutClient>
}
