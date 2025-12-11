"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Trophy, 
  TrendingDown, 
  AlertTriangle, 
  BarChart3,
  Target
} from "lucide-react"
import { ResultadosEvaluacionDocente, AspectoAMejorar } from "@/lib/types/profesores"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface ResultadosEvaluacionProps {
  resultados: ResultadosEvaluacionDocente | null
  isLoading?: boolean
}

export function ResultadosEvaluacion({ resultados, isLoading }: ResultadosEvaluacionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Cargando resultados...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!resultados || resultados.totalEvaluaciones === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gray-400" />
            Resultados de Evaluación
          </CardTitle>
          <CardDescription>
            Aún no hay evaluaciones registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Los estudiantes aún no han realizado evaluaciones.</p>
            <p className="text-sm mt-2">Los resultados aparecerán aquí cuando los estudiantes completen sus evaluaciones.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getCalificacionColor = (calificacion: string) => {
    switch (calificacion) {
      case 'Excelente': return 'bg-green-500'
      case 'Bueno': return 'bg-blue-500'
      case 'Aceptable': return 'bg-yellow-500'
      case 'Deficiente': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getPromedioColor = (promedio: string) => {
    const valor = parseFloat(promedio)
    if (valor >= 0.9) return 'text-green-600'
    if (valor >= 0.75) return 'text-blue-600'
    if (valor >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPromedioProgressColor = (promedio: string) => {
    const valor = parseFloat(promedio)
    if (valor >= 0.9) return 'bg-green-500'
    if (valor >= 0.75) return 'bg-blue-500'
    if (valor >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      {/* Nota Final General */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Nota Final de Evaluación
          </CardTitle>
          <CardDescription>
            Basada en {resultados.totalEvaluaciones} evaluaciones de {resultados.totalEstudiantes} estudiantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-blue-600">
                  {resultados.notaFinalEscala5}
                </div>
                <div className="text-gray-500">
                  <div className="text-lg">/ 5.0</div>
                  <div className="text-sm">({(parseFloat(resultados.notaFinal) * 100).toFixed(0)}%)</div>
                </div>
              </div>
              <Badge className={`mt-2 ${getCalificacionColor(resultados.calificacionCualitativa)}`}>
                {resultados.calificacionCualitativa}
              </Badge>
            </div>
            <div className="flex-1 max-w-md">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Calificación Promedio</span>
                  <span className="font-medium">{(parseFloat(resultados.notaFinal) * 100).toFixed(0)}%</span>
                </div>
                <Progress 
                  value={parseFloat(resultados.notaFinal) * 100} 
                  className="h-3"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aspectos a Mejorar */}
      {resultados.aspectosAMejorar.length > 0 && (
        <Card className="border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Aspectos a Mejorar
            </CardTitle>
            <CardDescription>
              Estos aspectos tienen un promedio inferior al 70% y requieren atención
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resultados.aspectosAMejorar.map((aspecto, index) => (
                <AspectoBajoRendimiento key={index} aspecto={aspecto} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados por Materia */}
      {resultados.notaFinalPorMateria.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Resultados por Asignatura
            </CardTitle>
            <CardDescription>
              Desglose de evaluaciones por cada materia impartida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {resultados.notaFinalPorMateria.map((materia, index) => (
                <AccordionItem key={materia.codigoMateria} value={`item-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <Target className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Código: {materia.codigoMateria}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-lg font-bold ${getPromedioColor(materia.notaFinal)}`}>
                          {(parseFloat(materia.notaFinal) * 5).toFixed(2)}
                        </span>
                        <Badge variant="outline">
                          {materia.totalEvaluaciones} eval. / {materia.totalEstudiantes} est.
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {materia.aspectos.map((asp, aspIndex) => (
                        <div key={aspIndex} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-medium">{asp.aspecto}</span>
                              <p className="text-sm text-gray-500">{asp.descripcion}</p>
                            </div>
                            <span className={`font-bold ${getPromedioColor(asp.promedio)}`}>
                              {(parseFloat(asp.promedio) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="relative h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`absolute h-full ${getPromedioProgressColor(asp.promedio)} rounded-full transition-all`}
                              style={{ width: `${parseFloat(asp.promedio) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}


    </div>
  )
}

// Componente auxiliar para mostrar aspectos de bajo rendimiento
function AspectoBajoRendimiento({ aspecto }: { aspecto: AspectoAMejorar }) {
  const promedioNum = parseFloat(aspecto.promedio)
  
  return (
    <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-orange-600" />
            <span className="font-medium text-orange-800">{aspecto.aspecto}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{aspecto.descripcion}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-600">
            {(promedioNum * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">
            Materia: {aspecto.codigoMateria}
          </div>
        </div>
      </div>
      
      <div className="relative h-2 w-full bg-orange-200 rounded-full overflow-hidden mb-2">
        <div 
          className="absolute h-full bg-orange-500 rounded-full transition-all"
          style={{ width: `${promedioNum * 100}%` }}
        />
      </div>
      
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-500">
          {aspecto.totalEvaluaciones} evaluaciones
        </span>
      </div>
    </div>
  )
}
