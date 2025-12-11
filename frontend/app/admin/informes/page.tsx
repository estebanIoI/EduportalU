"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Calendar, Users, Eye } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

interface EvaluacionGenerica {
  ID: number
  CONFIGURACION_ID: number
  DOCUMENTO_ESTUDIANTE: string
  COMENTARIO_GENERAL: string | null
  FECHA_EVALUACION: string
  ESTADO: string
  NOMBRE_ESTUDIANTE?: string
  NOMBRE_CONFIGURACION?: string
}

interface DetalleEvaluacion {
  evaluacion: any
  aspectos: any[]
  respuestas: any[]
}

export default function InformesPage() {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionGenerica[]>([])
  const [loading, setLoading] = useState(true)
  const [detalleDialog, setDetalleDialog] = useState(false)
  const [detalleSeleccionado, setDetalleSeleccionado] = useState<DetalleEvaluacion | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  useEffect(() => {
    cargarEvaluaciones()
  }, [])

  const cargarEvaluaciones = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluaciones-genericas/todas`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar las evaluaciones")
      }

      const data = await response.json()
      setEvaluaciones(data.data || [])
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las evaluaciones genéricas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const verDetalle = async (id: number) => {
    try {
      setLoadingDetalle(true)
      setDetalleDialog(true)
      
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluaciones-genericas/${id}/detalle`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar el detalle")
      }

      const data = await response.json()
      setDetalleSeleccionado(data.data)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el detalle de la evaluación",
        variant: "destructive",
      })
      setDetalleDialog(false)
    } finally {
      setLoadingDetalle(false)
    }
  }

  const descargarInforme = async (id: number) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluaciones-genericas/${id}/informe`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al descargar el informe")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `informe-evaluacion-${id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Descarga exitosa",
        description: "El informe se ha descargado correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo descargar el informe",
        variant: "destructive",
      })
    }
  }

  const descargarTodos = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluaciones-genericas/informe/todos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al descargar el informe consolidado")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `informe-evaluaciones-genericas-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Descarga exitosa",
        description: "El informe consolidado se ha descargado correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo descargar el informe consolidado",
        variant: "destructive",
      })
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="h-8 w-8 lg:h-10 lg:w-10 text-blue-600" />
              Informes de Evaluaciones Genéricas
            </h1>
            <p className="text-gray-600 mt-2">
              Supervisa y descarga los informes de las evaluaciones genéricas realizadas
            </p>
          </div>
          
          <Button
            onClick={descargarTodos}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
            disabled={evaluaciones.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar Informe Consolidado
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardDescription>Total de Evaluaciones</CardDescription>
              <CardTitle className="text-3xl">{evaluaciones.length}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardDescription>Completadas</CardDescription>
              <CardTitle className="text-3xl">
                {evaluaciones.filter(e => e.ESTADO === "Completada").length}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardDescription>Estudiantes Únicos</CardDescription>
              <CardTitle className="text-3xl">
                {new Set(evaluaciones.map(e => e.DOCUMENTO_ESTUDIANTE)).size}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabla de Evaluaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Evaluaciones</CardTitle>
            <CardDescription>
              Listado completo de todas las evaluaciones genéricas registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : evaluaciones.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No hay evaluaciones genéricas registradas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>Configuración</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluaciones.map((evaluacion) => (
                      <TableRow key={evaluacion.ID}>
                        <TableCell className="font-medium">#{evaluacion.ID}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{evaluacion.NOMBRE_ESTUDIANTE || "N/A"}</p>
                            <p className="text-sm text-gray-500">{evaluacion.DOCUMENTO_ESTUDIANTE}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {evaluacion.NOMBRE_CONFIGURACION || `Config #${evaluacion.CONFIGURACION_ID}`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatearFecha(evaluacion.FECHA_EVALUACION)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={evaluacion.ESTADO === "Completada" ? "default" : "secondary"}
                          >
                            {evaluacion.ESTADO}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => verDetalle(evaluacion.ID)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => descargarInforme(evaluacion.ID)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Detalle */}
      <Dialog open={detalleDialog} onOpenChange={setDetalleDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Evaluación</DialogTitle>
            <DialogDescription>
              Información completa de la evaluación genérica
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetalle ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : detalleSeleccionado ? (
            <div className="space-y-6">
              {/* Información general */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Estudiante</p>
                      <p className="font-medium">{detalleSeleccionado.evaluacion.DOCUMENTO_ESTUDIANTE}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha</p>
                      <p className="font-medium">{formatearFecha(detalleSeleccionado.evaluacion.FECHA_EVALUACION)}</p>
                    </div>
                  </div>
                  {detalleSeleccionado.evaluacion.COMENTARIO_GENERAL && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-500 mb-2">Comentario General</p>
                      <p className="text-gray-700">{detalleSeleccionado.evaluacion.COMENTARIO_GENERAL}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Aspectos evaluados */}
              {detalleSeleccionado.aspectos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Aspectos Evaluados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {detalleSeleccionado.aspectos.map((aspecto: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <p className="font-medium">{aspecto.ASPECTO || `Aspecto #${aspecto.ASPECTO_ID}`}</p>
                            <Badge>{aspecto.VALORACION || `Val. #${aspecto.VALORACION_ID}`}</Badge>
                          </div>
                          {aspecto.COMENTARIO && (
                            <p className="text-sm text-gray-600 mt-2">{aspecto.COMENTARIO}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Respuestas a preguntas */}
              {detalleSeleccionado.respuestas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Respuestas a Preguntas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {detalleSeleccionado.respuestas.map((respuesta: any, index: number) => (
                        <div key={index} className="p-3 bg-blue-50 rounded-lg">
                          <p className="font-medium text-sm text-gray-700 mb-2">
                            {respuesta.PREGUNTA || `Pregunta #${respuesta.PREGUNTA_ID}`}
                          </p>
                          <p className="text-gray-900">{respuesta.RESPUESTA}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500">No se pudo cargar el detalle</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
