'use client'

import { api } from '@/lib/api'

// Gera um session ID único
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

// Obtém ou cria session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = sessionStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = generateSessionId()
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}

// Cache de geolocalização
interface GeoData {
  country?: string
  country_code?: string
  city?: string
  region?: string
  latitude?: number
  longitude?: number
}

let geoDataCache: GeoData | null = null

// Obtém geolocalização via serviço de IP (gratuito com HTTPS)
async function getGeoLocation(): Promise<GeoData> {
  if (geoDataCache) return geoDataCache

  try {
    // Usar ipwho.is (gratuito, HTTPS, sem necessidade de API key)
    const response = await fetch('https://ipwho.is/')
    const data = await response.json()
    
    if (data.success) {
      geoDataCache = {
        country: data.country,
        country_code: data.country_code,
        city: data.city,
        region: data.region,
        latitude: data.latitude,
        longitude: data.longitude,
      }
      return geoDataCache
    }
  } catch (error) {
    console.warn('[Tracking] Could not get geolocation:', error)
  }

  return {}
}

export type TrackEventType = 
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

export interface TrackEventParams {
  event_type: TrackEventType
  course_id?: string
  lesson_id?: string
  material_id?: string
  event_data?: Record<string, any>
  current_page?: string
}

class TrackingService {
  private sessionId: string = ''
  private isInitialized: boolean = false
  private heartbeatInterval: NodeJS.Timeout | null = null
  private currentPage: string = ''
  private currentLessonId: string | null = null
  private currentCourseId: string | null = null
  private geoData: GeoData = {}

  // Inicializar tracking service
  async init() {
    if (typeof window === 'undefined') return
    if (this.isInitialized) return

    this.sessionId = getSessionId()
    this.isInitialized = true

    // Obter geolocalização em paralelo
    this.geoData = await getGeoLocation()

    // Iniciar sessão no servidor com geolocalização
    try {
      await api.post('/analytics/session/start', {
        session_id: this.sessionId,
        ...this.geoData,
      })
    } catch (error) {
      console.error('[Tracking] Error starting session:', error)
    }

    // Iniciar heartbeat para manter sessão ativa
    this.startHeartbeat()

    // Registrar evento de fechamento
    window.addEventListener('beforeunload', this.handleUnload.bind(this))
    
    // Rastrear mudanças de visibilidade
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))

    console.log('[Tracking] Service initialized with session:', this.sessionId, 'geo:', this.geoData)
  }

  // Enviar evento de tracking
  async track(params: TrackEventParams) {
    if (typeof window === 'undefined') return
    if (!this.isInitialized) await this.init()

    try {
      await api.post('/analytics/track', {
        ...params,
        session_id: this.sessionId,
        current_page: params.current_page || this.currentPage,
        ...this.geoData,
      })
    } catch (error) {
      console.error('[Tracking] Error tracking event:', error)
    }
  }

  // Track page view
  trackPageView(page: string) {
    this.currentPage = page
    this.track({
      event_type: 'page_view',
      current_page: page,
      event_data: {
        url: window.location.href,
        referrer: document.referrer,
        title: document.title,
      },
    })
  }

  // Track lesson start
  trackLessonStart(lessonId: string, courseId: string, lessonTitle?: string) {
    this.currentLessonId = lessonId
    this.currentCourseId = courseId
    this.track({
      event_type: 'lesson_start',
      lesson_id: lessonId,
      course_id: courseId,
      event_data: { lesson_title: lessonTitle },
    })
    this.sendHeartbeat() // Atualizar sessão imediatamente
  }

  // Track lesson progress
  trackLessonProgress(lessonId: string, courseId: string, progress: number) {
    this.track({
      event_type: 'lesson_progress',
      lesson_id: lessonId,
      course_id: courseId,
      event_data: { progress },
    })
  }

  // Track lesson complete
  trackLessonComplete(lessonId: string, courseId: string, lessonTitle?: string) {
    this.currentLessonId = null
    this.track({
      event_type: 'lesson_complete',
      lesson_id: lessonId,
      course_id: courseId,
      event_data: { lesson_title: lessonTitle },
    })
    this.sendHeartbeat()
  }

  // Track material download
  trackMaterialDownload(materialId: string, lessonId?: string, materialTitle?: string) {
    this.track({
      event_type: 'material_download',
      material_id: materialId,
      lesson_id: lessonId,
      event_data: { material_title: materialTitle },
    })
  }

  // Track material view
  trackMaterialView(materialId: string, lessonId?: string, materialTitle?: string) {
    this.track({
      event_type: 'material_view',
      material_id: materialId,
      lesson_id: lessonId,
      event_data: { material_title: materialTitle },
    })
  }

  // Track search
  trackSearch(query: string, resultsCount?: number) {
    this.track({
      event_type: 'search',
      event_data: { query, results_count: resultsCount },
    })
  }

  // Track comment
  trackCommentAdded(lessonId: string, courseId?: string) {
    this.track({
      event_type: 'comment_added',
      lesson_id: lessonId,
      course_id: courseId,
    })
  }

  // Track login
  trackLogin() {
    this.track({ event_type: 'login' })
  }

  // Track logout
  trackLogout() {
    this.track({ event_type: 'logout' })
  }

  // Track enrollment
  trackEnrollment(courseId: string, courseTitle?: string) {
    this.track({
      event_type: 'enrollment',
      course_id: courseId,
      event_data: { course_title: courseTitle },
    })
  }

  // Track certificate
  trackCertificateGenerated(courseId: string, courseTitle?: string) {
    this.track({
      event_type: 'certificate_generated',
      course_id: courseId,
      event_data: { course_title: courseTitle },
    })
  }

  // Iniciar heartbeat
  private startHeartbeat() {
    // Heartbeat a cada 30 segundos
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat()
    }, 30000)
  }

  // Enviar heartbeat
  private async sendHeartbeat() {
    if (typeof window === 'undefined') return
    
    try {
      await api.post('/analytics/session/heartbeat', {
        session_id: this.sessionId,
        current_page: this.currentPage,
        current_lesson_id: this.currentLessonId,
        current_course_id: this.currentCourseId,
      })
    } catch (error) {
      // Silenciar erros de heartbeat
    }
  }

  // Handle page unload
  private handleUnload() {
    // Usar sendBeacon para garantir que o request seja enviado
    if (navigator.sendBeacon) {
      const data = JSON.stringify({ session_id: this.sessionId })
      navigator.sendBeacon('/api/analytics/session/end', data)
    }
  }

  // Handle visibility change
  private handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      // Página ficou oculta, enviar heartbeat
      this.sendHeartbeat()
    } else if (document.visibilityState === 'visible') {
      // Página voltou a ficar visível, reiniciar heartbeat
      this.sendHeartbeat()
    }
  }

  // Cleanup
  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    window.removeEventListener('beforeunload', this.handleUnload.bind(this))
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
  }
}

// Singleton instance
export const trackingService = new TrackingService()
