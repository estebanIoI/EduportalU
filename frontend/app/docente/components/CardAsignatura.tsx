"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Grupo {
  GRUPO: string
  total_evaluaciones_esperadas: number
  evaluaciones_completadas: number
  porcentaje_completado: number
}

interface CardAsignaturaProps {
  codAsignatura: number
  nombreAsignatura: string
  semestre: string
  programa: string
  sede: string
  grupos: Grupo[]
  totalEvaluacionesEsperadas: number
  evaluacionesCompletadas: number
  porcentajeCompletado: number
  idDocente: string
}

export function CardAsignatura({
  codAsignatura,
  nombreAsignatura,
  semestre,
  programa,
  sede,
  grupos,
  totalEvaluacionesEsperadas,
  evaluacionesCompletadas,
  porcentajeCompletado,
  idDocente
}: CardAsignaturaProps) {
  const router = useRouter()

  const getEstadoBadge = (porcentaje: number) => {
    if (porcentaje === 100) {
      return <Badge className="bg-green-500">Completado</Badge>
    } else if (porcentaje >= 50) {
      return <Badge className="bg-yellow-500">En Progreso</Badge>
    } else {
      return <Badge className="bg-red-500">Pendiente</Badge>
    }
  }

  const handleGrupoClick = (grupo: Grupo, e: React.MouseEvent) => {
    e.stopPropagation()
    const params = new URLSearchParams({
      grupo: grupo.GRUPO,
      nombre: nombreAsignatura,
      semestre: semestre,
      programa: programa,
      sede: sede
    })
    router.push(`/docente/asignatura/${codAsignatura}?${params.toString()}`)
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-300"
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              {nombreAsignatura}
            </CardTitle>
            <CardDescription className="mt-1">
              Código: {codAsignatura}
            </CardDescription>
          </div>
          {getEstadoBadge(porcentajeCompletado)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información general */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <span className="font-medium">Semestre:</span> {semestre}
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <span className="font-medium">Sede:</span> {sede}
          </div>
          <div className="col-span-2 text-gray-600">
            <span className="font-medium">Programa:</span> {programa}
          </div>
        </div>

        {/* Progreso general */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-gray-700">Progreso General</span>
            <span className="text-gray-600">
              {evaluacionesCompletadas ?? 0}/{totalEvaluacionesEsperadas ?? 0} evaluaciones
            </span>
          </div>
          <Progress value={porcentajeCompletado ?? 0} className="h-2" />
          <div className="text-right text-xs text-gray-500">
            {(porcentajeCompletado ?? 0).toFixed(1)}%
          </div>
        </div>

        {/* Grupos */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Users className="h-4 w-4" />
            Grupos ({grupos?.length ?? 0})
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {(grupos ?? []).map((grupo) => (
              <div 
                key={grupo.GRUPO} 
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md text-xs hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={(e) => handleGrupoClick(grupo, e)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">Grupo {grupo.GRUPO}</span>
                  <span className="text-gray-500">
                    ({grupo.evaluaciones_completadas ?? 0}/{grupo.total_evaluaciones_esperadas ?? 0})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {(grupo.porcentaje_completado ?? 0) === 100 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="font-medium">{(grupo.porcentaje_completado ?? 0).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
