'use client'

import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useViewModeStore } from '@/features/auth/stores/view-mode.store'
import { AdminDashboard } from '@/features/dashboard/components/admin-dashboard'
import { StudentDashboard } from '@/features/dashboard/components/student-dashboard'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { isStudentView } = useViewModeStore()

  // Se for student OU estiver no modo preview de aluno, mostra o dashboard do aluno
  if (user?.role === 'student' || isStudentView) {
    return <StudentDashboard />
  }

  // Para owner, admin, instructor - mostra o dashboard administrativo
  return <AdminDashboard />
}
