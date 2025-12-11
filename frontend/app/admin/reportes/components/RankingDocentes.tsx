"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Docente } from "@/lib/types/reportes.types"
import { Trophy, TrendingUp, TrendingDown, Medal, Award, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  docentes: Docente[]
  topPositivos?: number
  topMejora?: number
}

export function RankingDocentes({ docentes, topPositivos = 5, topMejora = 5 }: Props) {
  if (!docentes || docentes.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Mejor Evaluados
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8 text-muted-foreground">
            No hay datos disponibles
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Con Más Áreas de Mejora
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8 text-muted-foreground">
            No hay datos disponibles
          </CardContent>
        </Card>
      </div>
    )
  }

  // Ordenar por promedio descendente (mejores)
  const mejorEvaluados = [...docentes]
    .sort((a, b) => b.promedio_general - a.promedio_general)
    .slice(0, topPositivos)

  // Ordenar por promedio ascendente (más áreas de mejora)
  const conMasMejora = [...docentes]
    .sort((a, b) => a.promedio_general - b.promedio_general)
    .slice(0, topMejora)

  // Iconos para posiciones
  const getIconoPosicion = (posicion: number) => {
    switch (posicion) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <Star className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Color de fondo según posición
  const getBgPosicion = (posicion: number) => {
    switch (posicion) {
      case 1:
        return "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"
      case 2:
        return "bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700"
      case 3:
        return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
      default:
        return "bg-background border-border"
    }
  }

  // Color del promedio
  const getColorPromedio = (promedio: number, esMejora: boolean = false) => {
    if (esMejora) {
      if (promedio < 3.0) return "text-red-600 dark:text-red-400"
      if (promedio < 3.5) return "text-orange-600 dark:text-orange-400"
      return "text-yellow-600 dark:text-yellow-400"
    }
    if (promedio >= 4.5) return "text-green-600 dark:text-green-400"
    if (promedio >= 4.0) return "text-blue-600 dark:text-blue-400"
    return "text-yellow-600 dark:text-yellow-400"
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Mejor Evaluados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top {topPositivos} Mejor Evaluados
          </CardTitle>
          <CardDescription>
            Docentes con los promedios más altos en sus evaluaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mejorEvaluados.map((docente, index) => (
            <div
              key={docente.documento}
              className={cn(
                "flex items-center gap-4 p-3 rounded-lg border transition-colors",
                getBgPosicion(index + 1)
              )}
            >
              <div className="flex items-center justify-center w-8 h-8">
                {getIconoPosicion(index + 1)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{docente.nombre}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {docente.programa || "Sin programa asignado"}
                </p>
              </div>
              <div className="text-right">
                <p className={cn("text-lg font-bold", getColorPromedio(docente.promedio_general))}>
                  {docente.promedio_general.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {docente.materias.length} materia{docente.materias.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Con Más Áreas de Mejora */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Docentes con Oportunidades de Mejora
          </CardTitle>
          <CardDescription>
            Docentes que pueden beneficiarse de acompañamiento o capacitación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {conMasMejora.map((docente, index) => (
            <div
              key={docente.documento}
              className="flex items-center gap-4 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8">
                <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                  {index + 1}
                </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{docente.nombre}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {docente.programa || "Sin programa asignado"}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "text-lg font-bold",
                    getColorPromedio(docente.promedio_general, true)
                  )}
                >
                  {docente.promedio_general.toFixed(2)}
                </p>
                <div className="flex items-center gap-1 justify-end">
                  <TrendingDown className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {docente.total_comentarios || 0} comentarios
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// Ranking por aspecto específico
interface PropsAspecto {
  docentes: Docente[]
  aspecto: string
  top?: number
}

export function RankingPorAspecto({ docentes, aspecto, top = 5 }: PropsAspecto) {
  // Calcular promedio del aspecto específico para cada docente
  const docentesConAspecto = docentes
    .map((docente) => {
      let sumaAspecto = 0
      let countAspecto = 0

      docente.materias.forEach((materia) => {
        const asp = materia.aspectos.find(
          (a) => a.nombre.toLowerCase() === aspecto.toLowerCase()
        )
        if (asp) {
          sumaAspecto += asp.promedio
          countAspecto++
        }
      })

      return {
        ...docente,
        promedioAspecto: countAspecto > 0 ? sumaAspecto / countAspecto : null,
      }
    })
    .filter((d) => d.promedioAspecto !== null)
    .sort((a, b) => (b.promedioAspecto || 0) - (a.promedioAspecto || 0))
    .slice(0, top)

  if (docentesConAspecto.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ranking: {aspecto}</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-4 text-muted-foreground text-sm">
          No hay datos para este aspecto
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          Ranking: {aspecto}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {docentesConAspecto.map((docente, index) => (
          <div
            key={docente.documento}
            className="flex items-center gap-3 py-2 border-b last:border-0"
          >
            <Badge
              variant={index < 3 ? "default" : "outline"}
              className="w-6 h-6 flex items-center justify-center text-xs"
            >
              {index + 1}
            </Badge>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{docente.nombre}</p>
            </div>
            <span className="text-sm font-bold text-primary">
              {docente.promedioAspecto?.toFixed(2)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
