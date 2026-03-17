interface LayoutClientProps {
  children: React.ReactNode
}

export function LayoutClient({ children }: LayoutClientProps) {
  // Layout simples - o pai já cuida da autenticação e 100vh
  return (
    <div className="h-full bg-zinc-950">
      {children}
    </div>
  )
}
