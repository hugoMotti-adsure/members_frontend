export type DisplayMode = 'default' | 'netflix'

export interface Course {
  id: string
  tenant_id: string
  title: string
  slug: string
  description?: string
  thumbnail_url?: string
  small_thumbnail_url?: string
  display_mode?: DisplayMode
  is_published: boolean
  is_featured: boolean
  price: number
  order_index: number
  settings?: Record<string, any>
  created_by: string
  created_at: string
  updated_at: string
  modules?: Module[]
}

export interface Module {
  id: string
  course_id: string
  title: string
  description?: string
  thumbnail_url?: string
  order_index: number
  is_published: boolean
  release_date?: string
  created_at: string
  updated_at: string
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  module_id: string
  title: string
  description?: string
  thumbnail_url?: string
  video_url?: string
  video_provider?: 'youtube' | 'vimeo' | 'panda' | 'bunny' | 'custom'
  duration_minutes?: number
  order_index: number
  is_published: boolean
  is_free: boolean
  release_date?: string
  attachments?: Attachment[]
  banner_url?: string
  banner_link?: string
  created_at: string
  updated_at: string
}

export interface Attachment {
  name: string
  url: string
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  status: 'active' | 'expired' | 'cancelled'
  enrolled_at: string
  expires_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  is_completed: boolean
  watched_seconds: number
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Certificate {
  id: string
  user_id: string
  course_id: string
  certificate_number: string
  issued_at: string
  template_data?: Record<string, any>
  created_at: string
}
