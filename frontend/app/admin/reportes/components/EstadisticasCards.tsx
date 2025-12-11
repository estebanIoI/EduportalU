"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, TrendingUp, Building2, GraduationCap, Building, Activity } from "lucide-react"
import { NivelReporte, EstadisticasBase, EstadisticasFacultad, EstadisticasInstitucional } from "@/lib/types/reportes.types"

interface Props {
  estadisticas: EstadisticasBase | EstadisticasFacultad | EstadisticasInstitucional
  nivel: NivelReporte
}

export function EstadisticasCards({ estadisticas, nivel }: Props) {
  const cards = [
    {
      titulo: "Docentes Evaluados",
      valor: estadisticas.total_docentes,
      icono: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      titulo: "Estudiantes Evaluaron",
      valor: estadisticas.total_estudiantes_evaluaron,
      icono: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      titulo: "Total Evaluaciones",
      valor: estadisticas.total_evaluaciones,
      icono: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      titulo: "Promedio General",
      valor: estadisticas.promedio_general?.toFixed(2) || "0.00",
      icono: TrendingUp,
      color: estadisticas.promedio_general >= 4 ? "text-green-600" : estadisticas.promedio_general >= 3 ? "text-yellow-600" : "text-red-600",
      bgColor: estadisticas.promedio_general >= 4 ? "bg-green-100" : estadisticas.promedio_general >= 3 ? "bg-yellow-100" : "bg-red-100",
    },
  ]

  // Agregar cards adicionales según el nivel
  if (nivel === "facultad" && "total_programas" in estadisticas) {
    cards.splice(1, 0, {
      titulo: "Programas",
      valor: (estadisticas as EstadisticasFacultad).total_programas,
      icono: GraduationCap,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    })
  }

  if (nivel === "institucional" && "total_facultades" in estadisticas) {
    cards.splice(0, 0, {
      titulo: "Facultades",
      valor: (estadisticas as EstadisticasInstitucional).total_facultades,
      icono: Building2,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    })
    cards.splice(2, 0, {
      titulo: "Programas",
      valor: (estadisticas as EstadisticasInstitucional).total_programas,
      icono: Building,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    })
  }

  // Agregar desviación si está disponible
  if (estadisticas.desviacion_general !== undefined) {
    cards.push({
      titulo: "Desviación Estándar",
      valor: estadisticas.desviacion_general?.toFixed(2) || "0.00",
      icono: Activity,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.titulo}
            </CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <card.icono className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.valor}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
