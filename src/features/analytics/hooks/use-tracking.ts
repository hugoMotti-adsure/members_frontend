'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackingService } from '../services/tracking.service'

// Hook para inicializar tracking e rastrear page views automaticamente
export function useTracking() {
  const pathname = usePathname()

  useEffect(() => {
    // Inicializar tracking service
    trackingService.init()

    return () => {
      // Cleanup ao desmontar (opcional, o service é singleton)
    }
  }, [])

  useEffect(() => {
    // Track page view sempre que a rota mudar
    if (pathname) {
      trackingService.trackPageView(pathname)
    }
  }, [pathname])

  return trackingService
}

// Hook para tracking de aulas
export function useLessonTracking(lessonId: string, courseId: string, lessonTitle?: string) {
  useEffect(() => {
    if (lessonId && courseId) {
      trackingService.trackLessonStart(lessonId, courseId, lessonTitle)
    }

    return () => {
      // Quando sair da aula, limpar current lesson
      trackingService.trackLessonProgress(lessonId, courseId, 0)
    }
  }, [lessonId, courseId, lessonTitle])

  return {
    trackProgress: (progress: number) => {
      trackingService.trackLessonProgress(lessonId, courseId, progress)
    },
    trackComplete: () => {
      trackingService.trackLessonComplete(lessonId, courseId, lessonTitle)
    },
  }
}

// Hook para tracking de downloads
export function useDownloadTracking() {
  return {
    trackDownload: (materialId: string, lessonId?: string, materialTitle?: string) => {
      trackingService.trackMaterialDownload(materialId, lessonId, materialTitle)
    },
    trackView: (materialId: string, lessonId?: string, materialTitle?: string) => {
      trackingService.trackMaterialView(materialId, lessonId, materialTitle)
    },
  }
}
