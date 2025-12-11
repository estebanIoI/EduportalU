"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { authService, profesoresService, evaluacionesGenericasService } from "@/services"
import { PerfilDocente } from "@/lib/types/auth"
import { EvaluacionesEstudiantes } from "@/lib/types/profesores"
import { DocenteHeader } from "../../components/DocenteHeader"
import { EstadisticasProgress } from "../../components/EstadisticasProgress"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, BookOpen, Users, GraduationCap } from "lucide-react"
import { apiClient } from "@/services/api.client"

interface EstudianteDetalle {
  id_estudiante: string
  nombre_estudiante: string
  evaluado: boolean
}

export default function AsignaturaDetallePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const codAsignatura = params.codAsignatura as string
  const grupo = searchParams.get("grupo") || ""
  const nombreAsignatura = searchParams.get("nombre") || ""
  const semestre = searchParams.get("semestre") || ""
  const programa = searchParams.get("programa") || ""
  const sede = searchParams.get("sede") || ""

  const [perfil, setPerfil] = useState<PerfilDocente | null>(null)
  const [estadisticas, setEstadisticas] = useState<EvaluacionesEstudiantes | null>(null)
  const [estudiantes, setEstudiantes] = useState<EstudianteDetalle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [codAsignatura, grupo])

  const cargarDatos = async () => {
    try {
      setIsLoading(true)

      // Obtener perfil del docente
      const perfilResponse = await authService.getProfile()
      if (perfilResponse.success && perfilResponse.data.tipo === "docente") {
        const perfilDocente = perfilResponse.data as PerfilDocente
        setPerfil(perfilDocente)

        // Obtener estadísticas de evaluaciones
        const estadisticasResponse = await profesoresService.getEvaluacionesEstudiantes(
          perfilDocente.documento,
          Number(codAsignatura),
          grupo
        )

        if (estadisticasResponse.success) {
          setEstadisticas(estadisticasResponse.data)
        }

        // Obtener lista detallada de estudiantes desde vista_academica_insitus
        await cargarListaEstudiantes(perfilDocente.documento)
      }
    } catch (error: any) {
      console.error("Error cargando datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la asignatura",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const cargarListaEstudiantes = async (idDocente: string) => {
    try {
      // Obtener estudiantes desde la vista académica
      const response = await apiClient.get<any[]>(
        `/academica`,
        {
          params: {
            ID_DOCENTE: idDocente,
            COD_ASIGNATURA: codAsignatura,
            GRUPO: grupo
          }
        }
      )

      if (response.success && response.data) {
        // Obtener evaluaciones para ver cuáles estudiantes ya evaluaron
        const estudiantesUnicos = Array.from(
          new Set(response.data.map((e: any) => e.ID_ESTUDIANTE))
        ) as string[]

        // Consultar evaluaciones de docentes (in-situ)
        const evaluacionesPromises = estudiantesUnicos.map(async (idEstudiante) => {
          try {
            const evalResponse = await apiClient.getSilent<any>(
              `/evaluaciones/estudiante/${idEstudiante}/asignatura/${codAsignatura}`
            )
            return {
              id_estudiante: idEstudiante,
              evaluado: evalResponse.success && evalResponse.data && evalResponse.data.length > 0
            }
          } catch {
            return {
              id_estudiante: idEstudiante,
              evaluado: false
            }
          }
        })

        const evaluacionesStatus = await Promise.all(evaluacionesPromises)
        const evaluacionesMap = new Map(
          evaluacionesStatus.map(e => [e.id_estudiante, e.evaluado])
        )

        // Crear lista de estudiantes con sus nombres y estado
        const estudiantesDetalle: EstudianteDetalle[] = response.data
          .filter((e: any, index: number, self: any[]) => 
            self.findIndex((x: any) => x.ID_ESTUDIANTE === e.ID_ESTUDIANTE) === index
          )
          .map((e: any) => ({
            id_estudiante: e.ID_ESTUDIANTE,
            nombre_estudiante: `${e.PRIMER_APELLIDO || ""} ${e.SEGUNDO_APELLIDO || ""} ${e.PRIMER_NOMBRE || ""} ${e.SEGUNDO_NOMBRE || ""}`.trim(),
            evaluado: evaluacionesMap.get(e.ID_ESTUDIANTE) || false
          }))
          .sort((a, b) => a.nombre_estudiante.localeCompare(b.nombre_estudiante))

        setEstudiantes(estudiantesDetalle)
      }
    } catch (error) {
      console.error("Error cargando estudiantes:", error)
    }
  }

  const handleLogout = () => {
    authService.removeTokens()
    router.push("/login")
  }

  const handleVolver = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-10 w-64" />
          </div>
        </header>
        <main className="container mx-auto p-4 max-w-7xl">
          <Skeleton className="h-64" />
        </main>
      </div>
    )
  }

  if (!perfil || !estadisticas) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>No se pudo cargar la información</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const porcentajeCompletado = estadisticas.total_estudiantes > 0
    ? (estadisticas.evaluaciones_realizadas / estadisticas.total_estudiantes) * 100
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <DocenteHeader
        nombreDocente={perfil.nombre_completo}
        cedulaDocente={perfil.documento}
        sede={perfil.sede}
        onLogout={handleLogout}
      />

      <main className="container mx-auto p-4 max-w-7xl">
        {/* Botón volver */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={handleVolver}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Mis Asignaturas
        </Button>

        {/* Información de la asignatura */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{nombreAsignatura}</CardTitle>
                  <CardDescription className="mt-1">
                    Código: {codAsignatura} • Grupo: {grupo}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Semestre:</span>
                <span className="font-medium">{semestre}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Programa:</span>
                <span className="font-medium">{programa}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Sede:</span>
                <span className="font-medium">{sede}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="mb-6">
          <EstadisticasProgress
            totalEstudiantes={estadisticas.total_estudiantes}
            evaluacionesCompletadas={estadisticas.evaluaciones_realizadas}
            evaluacionesPendientes={estadisticas.evaluaciones_sin_realizar}
            porcentajeCompletado={porcentajeCompletado}
          />
        </div>

        {/* Tabla de estudiantes */}
        <Card>
          <CardHeader>
            <CardTitle>Estudiantes del Grupo {grupo}</CardTitle>
            <CardDescription>
              Lista de estudiantes y su estado de evaluación
            </CardDescription>
          </CardHeader>
          <CardContent>
            {estudiantes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay estudiantes asignados a este grupo
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Cédula</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Nombre del Estudiante</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estudiantes.map((estudiante, index) => (
                        <tr key={estudiante.id_estudiante} className="border-b last:border-b-0 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{index + 1}</td>
                          <td className="px-4 py-3 text-sm">{estudiante.id_estudiante}</td>
                          <td className="px-4 py-3 text-sm">{estudiante.nombre_estudiante}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            {estudiante.evaluado ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Evaluado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                ⏱ Pendiente
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
