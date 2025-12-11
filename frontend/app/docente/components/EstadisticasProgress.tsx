import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Users, CheckCircle2, Clock, TrendingUp } from "lucide-react"

interface EstadisticasProgressProps {
  totalEstudiantes: number
  evaluacionesCompletadas: number
  evaluacionesPendientes: number
  porcentajeCompletado: number
}

export function EstadisticasProgress({
  totalEstudiantes,
  evaluacionesCompletadas,
  evaluacionesPendientes,
  porcentajeCompletado
}: EstadisticasProgressProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEstudiantes}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Estudiantes asignados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completadas</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{evaluacionesCompletadas}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Evaluaciones realizadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{evaluacionesPendientes}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Por completar
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progreso</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{porcentajeCompletado.toFixed(1)}%</div>
          <Progress value={porcentajeCompletado} className="h-2 mt-2" />
        </CardContent>
      </Card>
    </div>
  )
}
