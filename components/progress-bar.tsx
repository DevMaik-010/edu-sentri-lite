import { Progress } from "@/components/ui/progress"

interface ProgressBarProps {
  actual: number
  total: number
}

export function ProgressBar({ actual, total }: ProgressBarProps) {
  const porcentaje = (actual / total) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-medium">
        <span>Progreso</span>
        <span className="text-muted-foreground">
          {actual}/{total}
        </span>
      </div>
      <Progress value={porcentaje} className="h-3" />
    </div>
  )
}
