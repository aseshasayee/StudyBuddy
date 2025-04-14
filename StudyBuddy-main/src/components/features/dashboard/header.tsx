interface DashboardHeaderProps {
  name: string
  level: number
  title: string
}

export function DashboardHeader({ name, level, title }: DashboardHeaderProps) {
  return (
    <div className="text-center space-y-2">
      <h1 className="text-3xl font-bold">
        Good Morning, {name} 👋
      </h1>
      <p className="text-muted-foreground">
        Let's make today productive!
      </p>
      <div className="inline-block bg-yellow-100 dark:bg-yellow-900 px-4 py-1 rounded-full">
        🏆 Level {level}: {title}
      </div>
    </div>
  )
}