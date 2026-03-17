// Types para Analytics em tempo real

export interface RealtimeStats {
  users_online: number
  watching_lessons: number
  page_views_last_hour: number
  lessons_completed_today: number
  downloads_today: number
}

export interface ActiveSession {
  id: string
  session_id: string
  current_page?: string
  current_course_id?: string
  current_lesson_id?: string
  country?: string
  country_code?: string
  city?: string
  latitude?: number
  longitude?: number
  device_type?: string
  browser?: string
  started_at: string
  last_activity_at: string
  user: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
  current_lesson?: {
    id: string
    title: string
    modules?: {
      id: string
      title: string
      courses?: {
        id: string
        title: string
      }
    }
  }
  current_course?: {
    id: string
    title: string
  }
}

export interface LiveEvent {
  id: string
  event_type: EventType
  event_data: Record<string, any>
  course_id?: string
  lesson_id?: string
  material_id?: string
  country?: string
  country_code?: string
  city?: string
  device_type?: string
  created_at: string
  user: {
    id: string
    name: string
    email: string
    avatar_url?: string
  }
  lesson?: {
    id: string
    title: string
  }
  course?: {
    id: string
    title: string
  }
  material?: {
    id: string
    title: string
  }
}

export type EventType = 
  | 'page_view'
  | 'lesson_start'
  | 'lesson_progress'
  | 'lesson_complete'
  | 'material_download'
  | 'material_view'
  | 'login'
  | 'logout'
  | 'enrollment'
  | 'certificate_generated'
  | 'search'
  | 'comment_added'

export interface GeoDistribution {
  countries: Array<{
    name: string
    code: string
    count: number
  }>
  cities: Array<{
    name: string
    country: string
    lat: number
    lng: number
    count: number
  }>
  points: Array<{
    lat: number
    lng: number
    count: number
  }>
}

export interface DailyAnalytics {
  date: string
  page_views: number
  lesson_views: number
  lessons_completed: number
  downloads: number
  unique_visitors: number
}

export interface StudentActivity {
  id: string
  event_type: EventType
  event_data: Record<string, any>
  device_type?: string
  created_at: string
  lesson?: {
    id: string
    title: string
  }
  course?: {
    id: string
    title: string
  }
  material?: {
    id: string
    title: string
  }
}

export interface StudentDownload {
  id: string
  material_id: string
  event_data: Record<string, any>
  created_at: string
  material: {
    id: string
    title: string
    file_type: string
    file_size: number
    lesson: {
      title: string
      module: {
        title: string
        course: {
          title: string
        }
      }
    }
  }
}

// Event labels em português
export const EVENT_LABELS: Record<EventType, string> = {
  page_view: 'Visualizou página',
  lesson_start: 'Iniciou aula',
  lesson_progress: 'Progresso na aula',
  lesson_complete: 'Concluiu aula',
  material_download: 'Baixou material',
  material_view: 'Visualizou material',
  login: 'Fez login',
  logout: 'Fez logout',
  enrollment: 'Nova matrícula',
  certificate_generated: 'Certificado gerado',
  search: 'Pesquisou',
  comment_added: 'Adicionou comentário',
}

// Event colors
export const EVENT_COLORS: Record<EventType, string> = {
  page_view: 'bg-slate-500',
  lesson_start: 'bg-blue-500',
  lesson_progress: 'bg-blue-400',
  lesson_complete: 'bg-green-500',
  material_download: 'bg-purple-500',
  material_view: 'bg-purple-400',
  login: 'bg-emerald-500',
  logout: 'bg-gray-500',
  enrollment: 'bg-amber-500',
  certificate_generated: 'bg-yellow-500',
  search: 'bg-cyan-500',
  comment_added: 'bg-pink-500',
}

// ==========================================
// TIPOS PARA ANALYTICS POR CURSO
// ==========================================

export interface CourseForSelector {
  id: string
  title: string
  thumbnail_url?: string
  is_published: boolean
}

export interface CourseFunnelData {
  total_enrollments: number
  started: number
  halfway: number
  completed: number
  total_lessons: number
  funnel_rates: {
    enrollment_to_start: number
    start_to_halfway: number
    halfway_to_complete: number
    overall_completion: number
  }
}

export interface LessonHeatmapItem {
  id: string
  title: string
  order_index: number
  views: number
  completions: number
  completion_rate: number
  avg_watched_seconds: number
  heat_level: 'hot' | 'warm' | 'cold' | 'freezing'
}

export interface ModuleHeatmap {
  id: string
  title: string
  order_index: number
  lessons: LessonHeatmapItem[]
}

export interface CourseHeatmapData {
  total_enrollments: number
  modules: ModuleHeatmap[]
}

export interface CourseComparisonData {
  id: string
  title: string
  thumbnail_url?: string
  is_published: boolean
  total_enrollments: number
  active_enrollments: number
  completed: number
  completion_rate: number
  total_lessons: number
  active_now: number
  recent_enrollments: number
  trend: 'up' | 'down' | 'stable'
}

export interface CourseDailyAnalytics {
  date: string
  page_views: number
  lesson_views: number
  lessons_completed: number
  downloads: number
  unique_visitors: number
  new_enrollments: number
}
