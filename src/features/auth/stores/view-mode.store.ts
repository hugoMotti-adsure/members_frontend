'use client'

import { create } from 'zustand'

interface ViewModeState {
  isStudentView: boolean
  setStudentView: (value: boolean) => void
}

// Usa sessionStorage para que cada aba tenha seu próprio estado
const getInitialState = (): boolean => {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem('student-view-mode') === 'true'
}

export const useViewModeStore = create<ViewModeState>()((set) => ({
  isStudentView: false, // Será inicializado no cliente
  setStudentView: (value: boolean) => {
    if (typeof window !== 'undefined') {
      if (value) {
        sessionStorage.setItem('student-view-mode', 'true')
      } else {
        sessionStorage.removeItem('student-view-mode')
      }
    }
    set({ isStudentView: value })
  },
}))

// Hook para inicializar o estado no cliente
export const initViewModeFromSession = () => {
  if (typeof window !== 'undefined') {
    const isStudentView = sessionStorage.getItem('student-view-mode') === 'true'
    useViewModeStore.setState({ isStudentView })
  }
}
