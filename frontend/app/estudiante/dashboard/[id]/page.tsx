"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { authService } from "@/services/evaluacionITP/auth/auth.service"
import { PerfilEstudiante, MateriaEstudiante } from "@/lib/types/auth"
import { Progress } from "@/components/ui/progress"
import { apiClient } from "@/services/api.client" 
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { evaluacionesService } from "@/services" 
import type { Evaluacion } from "@/lib/types/evaluacionInsitu"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { Check, CircleOff, User, BookOpen, Calendar, GraduationCap, FileText, CheckCircle2 } from "lucide-react"

interface ReporteEvaluaciones {
  total_materias: number
  evaluaciones_completadas: number
  materias_pendientes: number
  porcentaje_completado: string
}

export default function EstudianteDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [perfil, setPerfil] = useState<PerfilEstudiante | null>(null)
  const [materias, setMaterias] = useState<MateriaEstudiante[]>([])
  const [reporte, setReporte] = useState<ReporteEvaluaciones | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([])
  const params = useParams()
  
  const configId = params?.id
  const id = configId ? (Array.isArray(configId) ? Number(configId[0]) : Number(configId)) : null

  useEffect(() => {    
    const cargarPerfil = async () => {
      try {
        const response = await authService.getProfile()
        if (response.success && response.data.tipo === "estudiante") {
          const perfilData = response.data as PerfilEstudiante
          setPerfil(perfilData)
          setMaterias(perfilData.materias)
          
          // ✅ Nuevo cliente con tipado
          try {
            const reporteResponse = await apiClient.get<ReporteEvaluaciones[]>(
              `/reportes/estudiantes/${perfilData.documento}/configuracion/${id}`
            )

            if (reporteResponse.success && reporteResponse.data.length > 0) {
              setReporte(reporteResponse.data[0])
            }
          } catch (error) {
            toast({
              title: "Error",
              description: "No se pudo cargar el reporte de evaluaciones",
              variant: "destructive",
            })
          }

          if (id !== null && !isNaN(id)) {
            try {
              const evaluacionesResponse = await evaluacionesService.getByEstudianteByConfiguracion(perfilData.documento, id);
              
              // Accede a la propiedad 'data' de la ApiResponse
              if (evaluacionesResponse.success && Array.isArray(evaluacionesResponse.data)) {
                setEvaluaciones(evaluacionesResponse.data);
              } else {
                console.log('Respuesta sin éxito o datos no válidos:', evaluacionesResponse);
                setEvaluaciones([]);
              }
            } catch (error) {
              console.error('Error cargando evaluaciones:', error);
              toast({
                title: "Error",
                description: "No se pudo cargar las evaluaciones",
                variant: "destructive",
              });
              setEvaluaciones([]); // Asegúrate de limpiar el estado en caso de error
            }
          } else {
            toast({
              title: "Error de navegación",
              description: "No se pudo identificar la configuración de evaluación",
              variant: "destructive",
            });
          }

        } else {
          toast({
            title: "Error",
            description: "No se pudo cargar el perfil del estudiante",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo cargar el perfil del estudiante",
          variant: "destructive",
        })
      }
    }

    if (configId !== undefined) {
      cargarPerfil()
    }
  }, [toast, id, configId, params])

  const handleEvaluarDocente = (id: number) => {
    window.location.href = `/estudiante/evaluar/${id}`
  }

  if (!perfil) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="container mx-auto p-6 max-w-6xl">
        {/* Card principal mejorada */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Tus Asignaturas</CardTitle>
                    <CardDescription className="text-gray-600 font-medium">
                      Selecciona una asignatura para evaluar al docente
                    </CardDescription>
                  </div>
                </div>
              </div>
              
              {reporte && (
                <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full mb-2">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">Progreso</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">Evaluaciones Completadas</p>
                        <p className="text-lg font-bold text-gray-900">
                          {reporte.evaluaciones_completadas} / {reporte.total_materias}
                        </p>
                      </div>
                      <div className="w-full max-w-xs">
                        <Progress 
                          value={parseFloat(reporte.porcentaje_completado)} 
                          className="h-3 bg-gray-200 rounded-full overflow-hidden"
                          indicatorClassName="bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 transition-all duration-500"
                        />
                        <p className="text-xs text-gray-500 text-right mt-1 font-medium">
                          {reporte.porcentaje_completado}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {evaluaciones.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <BookOpen className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No hay evaluaciones disponibles</h3>
                <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                  {id ? 
                    `No se encontraron evaluaciones para la configuración #${id}.` : 
                    'No se pudo identificar la configuración de evaluación.'
                  }
                </p>
                {!id && (
                  <Link href="/estudiante/bienvenida" className="inline-block mt-6">
                    <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                      Volver a Evaluaciones Disponibles
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {evaluaciones.map((evaluacion) => (
                  <div
                    key={evaluacion.ID}
                    className={`group relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                      evaluacion.ACTIVO 
                        ? 'border-green-200 bg-gradient-to-br from-green-50/50 to-white shadow-sm hover:shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-lg hover:-translate-y-1'
                    }`}
                  >
                    {/* Status indicator mejorado */}
                    <div className={`absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                      evaluacion.ACTIVO 
                        ? 'bg-gradient-to-br from-green-100 to-green-200 shadow-sm' 
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:shadow-sm'
                    }`}>
                      {evaluacion.ACTIVO ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <CircleOff className="w-5 h-5 text-gray-500" />
                      )}
                    </div>

                    <div className="p-6">
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3 pr-12 leading-tight">
                          {evaluacion.ASIGNATURA}
                        </h3>
                        
                        {/* CORREGIDO: Cambio de && por ? para evitar el "0" */}
                        {evaluacion.ACTIVO ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
                            <CheckCircle2 className="w-3 h-3" />
                            Evaluación Completada
                          </div>
                        ) : null}

                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0 group-hover:from-gray-200 group-hover:to-gray-300 transition-all duration-300">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Docente</p>
                            <p className="text-base font-semibold text-gray-900 leading-tight">{evaluacion.DOCENTE}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <GraduationCap className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium">
                            {evaluacion.SEMESTRE_PREDOMINANTE
                              .toLowerCase()
                              .replace(/(\d+)\s+semestre/, (_, num) => `${num}° Semestre`)}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="font-medium leading-tight">{evaluacion.PROGRAMA_PREDOMINANTE}</span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() =>
                          router.push(
                            `/estudiante/evaluar/${evaluacion.ID_CONFIGURACION}` +
                            `?docente=${encodeURIComponent(evaluacion.DOCENTE)}` +
                            `&cod=${encodeURIComponent(evaluacion.CODIGO_MATERIA)}` +
                            `&id=${encodeURIComponent(evaluacion.ID)}` +
                            `&materia=${encodeURIComponent(evaluacion.ASIGNATURA)}` +
                            `&semestre=${encodeURIComponent(evaluacion.SEMESTRE_PREDOMINANTE)}` +
                            `&programa=${encodeURIComponent(evaluacion.PROGRAMA_PREDOMINANTE)}`
                          )
                        }
                        disabled={evaluacion.ACTIVO}
                        className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                          evaluacion.ACTIVO
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200'
                            : 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white shadow-sm hover:shadow-md transform hover:scale-[1.02]'
                        }`}
                      >
                        {evaluacion.ACTIVO ? 'Evaluación Completada' : 'Evaluar Docente'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de perfil mejorado */}
        <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
          <DialogContent className="sm:max-w-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <DialogHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Información del Estudiante
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Documento</p>
                  <p className="text-lg font-bold text-gray-900">{perfil.tipo_doc} {perfil.documento}</p>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Estado</p>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 px-3 py-1 font-semibold">
                    {perfil.estado_matricula}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Semestre</p>
                  <p className="text-lg font-bold text-gray-900">{perfil.semestre}</p>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Programa</p>
                  <p className="text-lg font-bold text-gray-900 leading-tight">{perfil.programa}</p>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Periodo</p>
                  <p className="text-lg font-bold text-gray-900">{perfil.periodo}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}