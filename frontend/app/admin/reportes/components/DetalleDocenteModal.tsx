"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Docente, ResumenIA } from "@/lib/types/reportes.types"
import { GraficaRadarMateria, GraficaDistribucion } from "./GraficaAspectos"
import { ResumenIAPanel } from "./ResumenIAPanel"
import {
  User,
  BookOpen,
  BarChart3,
  MessageSquare,
  Sparkles,
  GraduationCap,
  TrendingUp,
  Award,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  docente: Docente | null
  open: boolean
  onClose: () => void
}

export function DetalleDocenteModal({ docente, open, onClose }: Props) {
  const [tabActiva, setTabActiva] = useState("materias")
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<string | null>(null)

  if (!docente) return null

  // Obtener color según promedio
  const getColorPromedio = (promedio: number) => {
    if (promedio >= 4.5) return "text-green-600 dark:text-green-400"
    if (promedio >= 4.0) return "text-blue-600 dark:text-blue-400"
    if (promedio >= 3.5) return "text-yellow-600 dark:text-yellow-400"
    if (promedio >= 3.0) return "text-orange-600 dark:text-orange-400"
    return "text-red-600 dark:text-red-400"
  }

  const getBgPromedio = (promedio: number) => {
    if (promedio >= 4.5) return "bg-green-50 dark:bg-green-950/30"
    if (promedio >= 4.0) return "bg-blue-50 dark:bg-blue-950/30"
    if (promedio >= 3.5) return "bg-yellow-50 dark:bg-yellow-950/30"
    if (promedio >= 3.0) return "bg-orange-50 dark:bg-orange-950/30"
    return "bg-red-50 dark:bg-red-950/30"
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <span>{docente.nombre}</span>
              <p className="text-sm font-normal text-muted-foreground">
                {docente.documento}
                {docente.programa && ` • ${docente.programa}`}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Resumen general del docente */}
        <div className="px-6 py-4 flex flex-wrap gap-4">
          <div className={cn("p-4 rounded-lg flex items-center gap-3", getBgPromedio(docente.promedio_general))}>
            <Award className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Promedio General</p>
              <p className={cn("text-2xl font-bold", getColorPromedio(docente.promedio_general))}>
                {docente.promedio_general.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Materias</p>
              <p className="text-2xl font-bold">{docente.materias.length}</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Comentarios</p>
              <p className="text-2xl font-bold">{docente.total_comentarios || 0}</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Evaluaciones</p>
              <p className="text-2xl font-bold">
                {docente.materias.reduce((sum, m) => sum + (m.total_evaluaciones || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Tabs de contenido */}
        <Tabs value={tabActiva} onValueChange={setTabActiva} className="flex-1">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="materias" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Por Materia
              </TabsTrigger>
              <TabsTrigger value="graficas" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Gráficas
              </TabsTrigger>
              <TabsTrigger value="ia" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Análisis IA
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(90vh-320px)] px-6 py-4">
            {/* Tab: Por Materia - Cada materia en su propio cuadro */}
            <TabsContent value="materias" className="mt-0 space-y-6">
              <p className="text-sm text-muted-foreground">
                Detalle de evaluación por cada materia impartida. Cada materia se muestra en su propio cuadro independiente.
              </p>

              <div className="grid grid-cols-1 gap-6">
                {docente.materias.map((materia) => (
                  <Card
                    key={materia.codigo || materia.nombre}
                    className="overflow-hidden"
                  >
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            {materia.nombre}
                          </CardTitle>
                          {materia.codigo && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Código: {materia.codigo}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("text-lg font-bold px-3 py-1", getColorPromedio(materia.promedio))}
                        >
                          {materia.promedio.toFixed(2)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Aspectos de la materia */}
                      <div>
                        <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Evaluación por Aspectos
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {materia.aspectos.map((aspecto) => (
                            <div
                              key={aspecto.nombre}
                              className="flex items-center justify-between p-2 bg-muted rounded-lg"
                            >
                              <span className="text-xs truncate flex-1 pr-2">
                                {aspecto.nombre}
                              </span>
                              <Badge
                                variant="secondary"
                                className={cn("shrink-0", getColorPromedio(aspecto.promedio))}
                              >
                                {aspecto.promedio.toFixed(2)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Observaciones de la materia */}
                      {((materia.observaciones && materia.observaciones.length > 0) || 
                        (materia.observaciones_crudas && materia.observaciones_crudas.length > 0)) && (
                        <div>
                          <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Observaciones ({(materia.observaciones || materia.observaciones_crudas || []).length})
                          </h5>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {(materia.observaciones || materia.observaciones_crudas || []).map((obs, index) => (
                              <div
                                key={index}
                                className="p-3 bg-muted/50 rounded-lg border-l-2 border-primary/30"
                              >
                                <p className="text-sm text-muted-foreground italic">
                                  &ldquo;{obs.texto}&rdquo;
                                </p>
                                {obs.fecha && (
                                  <p className="text-xs text-muted-foreground/70 mt-1">
                                    {new Date(obs.fecha).toLocaleDateString("es-CO")}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Información adicional */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                        {materia.total_evaluaciones && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {materia.total_evaluaciones} evaluaciones
                          </span>
                        )}
                        {materia.periodo && (
                          <span>Período: {materia.periodo}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tab: Gráficas */}
            <TabsContent value="graficas" className="mt-0 space-y-6">
              <p className="text-sm text-muted-foreground">
                Visualización gráfica del desempeño por materia
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {docente.materias.map((materia) => {
                  // Crear datos para gráfica radar
                  const graficaData = {
                    labels: materia.aspectos.map((a) => a.nombre),
                    values: materia.aspectos.map((a) => a.promedio),
                  }

                  return (
                    <GraficaRadarMateria
                      key={materia.codigo || materia.nombre}
                      materia={{
                        nombre: materia.nombre,
                        grafica: graficaData,
                      }}
                    />
                  )
                })}
              </div>
            </TabsContent>

            {/* Tab: Análisis IA */}
            <TabsContent value="ia" className="mt-0 space-y-6">
              <p className="text-sm text-muted-foreground">
                Genera un análisis con inteligencia artificial de los comentarios recibidos
              </p>

              {/* Selector de materia para análisis */}
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={materiaSeleccionada === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setMateriaSeleccionada(null)}
                >
                  Todas las materias
                </Badge>
                {docente.materias.map((materia) => (
                  <Badge
                    key={materia.codigo || materia.nombre}
                    variant={materiaSeleccionada === materia.nombre ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setMateriaSeleccionada(materia.nombre)}
                  >
                    {materia.nombre}
                  </Badge>
                ))}
              </div>

              <ResumenIAPanel
                docente={docente}
                materia={materiaSeleccionada || undefined}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
