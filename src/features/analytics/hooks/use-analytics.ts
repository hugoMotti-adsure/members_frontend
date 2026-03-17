'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { 
  RealtimeStats, 
  ActiveSession, 
  LiveEvent, 
  GeoDistribution,
  DailyAnalytics,
  CourseForSelector,
  CourseFunnelData,
  CourseHeatmapData,
  CourseComparisonData,
  CourseDailyAnalytics,
} from '../types'

// Hook para estatísticas em tempo real
export function useRealtimeStats(refetchInterval = 5000) {
  return useQuery<RealtimeStats>({
    queryKey: ['analytics', 'realtime-stats'],
    queryFn: async () => {
      const response = await api.get('/analytics/realtime')
      return response.data
    },
    refetchInterval,
  })
}

// Hook para sessões ativas
export function useActiveSessions(refetchInterval = 5000) {
  return useQuery<ActiveSession[]>({
    queryKey: ['analytics', 'active-sessions'],
    queryFn: async () => {
      const response = await api.get('/analytics/realtime/sessions')
      return response.data
    },
    refetchInterval,
  })
}

// Hook para eventos em tempo real
export function useLiveEvents(limit = 50, refetchInterval = 3000) {
  return useQuery<LiveEvent[]>({
    queryKey: ['analytics', 'live-events', limit],
    queryFn: async () => {
      const response = await api.get(`/analytics/realtime/events?limit=${limit}`)
      return response.data
    },
    refetchInterval,
  })
}

// Hook para distribuição geográfica
export function useGeoDistribution(refetchInterval = 30000) {
  return useQuery<GeoDistribution>({
    queryKey: ['analytics', 'geo-distribution'],
    queryFn: async () => {
      const response = await api.get('/analytics/realtime/geo')
      return response.data
    },
    refetchInterval,
  })
}

// Hook para analytics diários
export function useDailyAnalytics(days = 30) {
  return useQuery<DailyAnalytics[]>({
    queryKey: ['analytics', 'daily', days],
    queryFn: async () => {
      const response = await api.get(`/analytics/daily?days=${days}`)
      return response.data
    },
  })
}

// Hook para dashboard stats
export function useDashboardStats() {
  return useQuery({
    queryKey: ['analytics', 'dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard')
      return response.data
    },
  })
}

// Hook para analytics de um estudante
export function useStudentAnalytics(studentId: string) {
  return useQuery({
    queryKey: ['analytics', 'student', studentId],
    queryFn: async () => {
      const response = await api.get(`/analytics/student/${studentId}`)
      return response.data
    },
    enabled: !!studentId,
  })
}

// Hook para atividades de um estudante
export function useStudentActivity(studentId: string, limit = 100) {
  return useQuery({
    queryKey: ['analytics', 'student-activity', studentId, limit],
    queryFn: async () => {
      const response = await api.get(`/analytics/student/${studentId}/activity?limit=${limit}`)
      return response.data
    },
    enabled: !!studentId,
  })
}

// Hook para downloads de um estudante
export function useStudentDownloads(studentId: string) {
  return useQuery({
    queryKey: ['analytics', 'student-downloads', studentId],
    queryFn: async () => {
      const response = await api.get(`/analytics/student/${studentId}/downloads`)
      return response.data
    },
    enabled: !!studentId,
  })
}

// ==========================================
// HOOKS PARA ANALYTICS POR CURSO
// ==========================================

// Hook para lista de cursos (seletor)
export function useCoursesForSelector() {
  return useQuery<CourseForSelector[]>({
    queryKey: ['analytics', 'courses-list'],
    queryFn: async () => {
      const response = await api.get('/analytics/courses/list')
      return response.data
    },
  })
}

// Hook para comparativo de cursos
export function useCoursesComparison() {
  return useQuery<CourseComparisonData[]>({
    queryKey: ['analytics', 'courses-comparison'],
    queryFn: async () => {
      const response = await api.get('/analytics/courses/comparison')
      return response.data
    },
  })
}

// Hook para stats em tempo real de um curso
export function useCourseRealtimeStats(courseId: string | null, refetchInterval = 5000) {
  return useQuery<RealtimeStats>({
    queryKey: ['analytics', 'course-realtime-stats', courseId],
    queryFn: async () => {
      const response = await api.get(`/analytics/course/${courseId}/realtime`)
      return response.data
    },
    refetchInterval,
    enabled: !!courseId,
  })
}

// Hook para sessões ativas de um curso
export function useCourseActiveSessions(courseId: string | null, refetchInterval = 5000) {
  return useQuery<ActiveSession[]>({
    queryKey: ['analytics', 'course-active-sessions', courseId],
    queryFn: async () => {
      const response = await api.get(`/analytics/course/${courseId}/sessions`)
      return response.data
    },
    refetchInterval,
    enabled: !!courseId,
  })
}

// Hook para eventos de um curso
export function useCourseLiveEvents(courseId: string | null, limit = 50, refetchInterval = 3000) {
  return useQuery<LiveEvent[]>({
    queryKey: ['analytics', 'course-live-events', courseId, limit],
    queryFn: async () => {
      const response = await api.get(`/analytics/course/${courseId}/events?limit=${limit}`)
      return response.data
    },
    refetchInterval,
    enabled: !!courseId,
  })
}

// Hook para funil de um curso
export function useCourseFunnel(courseId: string | null) {
  return useQuery<CourseFunnelData>({
    queryKey: ['analytics', 'course-funnel', courseId],
    queryFn: async () => {
      const response = await api.get(`/analytics/course/${courseId}/funnel`)
      return response.data
    },
    enabled: !!courseId,
  })
}

// Hook para heatmap de um curso
export function useCourseLessonHeatmap(courseId: string | null) {
  return useQuery<CourseHeatmapData>({
    queryKey: ['analytics', 'course-heatmap', courseId],
    queryFn: async () => {
      const response = await api.get(`/analytics/course/${courseId}/heatmap`)
      return response.data
    },
    enabled: !!courseId,
  })
}

// Hook para analytics diários de um curso
export function useCourseDailyAnalytics(courseId: string | null, days = 30) {
  return useQuery<CourseDailyAnalytics[]>({
    queryKey: ['analytics', 'course-daily', courseId, days],
    queryFn: async () => {
      const response = await api.get(`/analytics/course/${courseId}/daily?days=${days}`)
      return response.data
    },
    enabled: !!courseId,
  })
}

// Hook para geo distribution de um curso
export function useCourseGeoDistribution(courseId: string | null, refetchInterval = 30000) {
  return useQuery<GeoDistribution>({
    queryKey: ['analytics', 'course-geo', courseId],
    queryFn: async () => {
      const response = await api.get(`/analytics/course/${courseId}/geo`)
      return response.data
    },
    refetchInterval,
    enabled: !!courseId,
  })
}
