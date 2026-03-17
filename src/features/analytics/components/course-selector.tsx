'use client'

import { motion } from 'framer-motion'
import { BookOpen, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCoursesForSelector } from '../hooks/use-analytics'
import type { CourseForSelector } from '../types'

interface CourseSelectorProps {
  selectedCourseId: string | null
  onSelectCourse: (courseId: string | null) => void
}

export function CourseSelector({ selectedCourseId, onSelectCourse }: CourseSelectorProps) {
  const { data: courses, isLoading } = useCoursesForSelector()

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted">
        <div className="h-10 w-32 bg-muted animate-pulse rounded-lg shrink-0" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-40 bg-muted animate-pulse rounded-lg shrink-0" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted">
      {/* Botão Visão Geral */}
      <motion.button
        onClick={() => onSelectCourse(null)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0',
          'border hover:border-primary/50',
          selectedCourseId === null
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card text-muted-foreground border-border hover:text-foreground'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <LayoutGrid className="h-4 w-4" />
        Visão Geral
      </motion.button>

      {/* Botões dos cursos */}
      {courses?.map((course: CourseForSelector) => (
        <motion.button
          key={course.id}
          onClick={() => onSelectCourse(course.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0',
            'border hover:border-primary/50',
            selectedCourseId === course.id
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:text-foreground'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="h-5 w-5 rounded object-cover"
            />
          ) : (
            <BookOpen className="h-4 w-4" />
          )}
          <span className="max-w-[150px] truncate">{course.title}</span>
          {!course.is_published && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Draft
            </span>
          )}
        </motion.button>
      ))}
    </div>
  )
}
