"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { authService, profesoresService } from "@/services"
import { PerfilDocente } from "@/lib/types/auth"
import { AsignaturaInfo, ResultadosEvaluacionDocente } from "@/lib/types/profesores"
import { DocenteHeader } from "../components/DocenteHeader"
import { CardAsignatura } from "../components/CardAsignatura"
import { EstadisticasProgress } from "../components/EstadisticasProgress"
import { ResultadosEvaluacion } from "../components/ResultadosEvaluacion"
import { AutoevaluacionDocente } from "../components/AutoevaluacionDocente"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/services/api.client"

export default function DocenteDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [perfil, setPerfil] = useState<PerfilDocente | null>(null)
  const [asignaturas, setAsignaturas] = useState<AsignaturaInfo[]>([])
  const [resultadosEvaluacion, setResultadosEvaluacion] = useState<ResultadosEvaluacionDocente | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingResultados, setIsLoadingResultados] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarDatosDocente()
  }, [])

  const cargarDatosDocente = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Obtener perfil del docente
      const perfilResponse = await authService.getProfile()
      if (perfilResponse.success && perfilResponse.data.tipo === "docente") {
        const perfilDocente = perfilResponse.data as PerfilDocente
        setPerfil(perfilDocente)

        // Obtener asignaturas del docente con estadísticas de evaluaciones
        const asignaturasResponse = await profesoresService.getAsignaturas(
          { page: 1, limit: 100 },
          {
            idDocente: perfilDocente.documento,
            periodo: perfilDocente.periodo,
            nombreSede: perfilDocente.sede
          }
        )

        if (asignaturasResponse.success && asignaturasResponse.data.length > 0) {
          // Tomar el primer elemento que contiene todas las asignaturas
          const datosDocente = asignaturasResponse.data[0]
          setAsignaturas(datosDocente.asignaturas || [])
        }

        // Cargar resultados de evaluación
        await cargarResultadosEvaluacion(perfilDocente.documento)
      } else {
        toast({
          title: "Error de acceso",
          description: "No tienes permisos para acceder a esta sección",
          variant: "destructive",
        })
        router.push("/login")
      }
    } catch (error: any) {
      console.error("Error cargando datos del docente:", error)
      setError(error.message || "Error al cargar los datos")
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del docente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const cargarResultadosEvaluacion = async (documentoDocente: string) => {
    try {
      setIsLoadingResultados(true)
      const response = await apiClient.getSilent<ResultadosEvaluacionDocente>(
        `/evaluaciones/docente/${documentoDocente}/resultados`
      )
      
      if (response.success && response.data) {
        setResultadosEvaluacion(response.data)
      }
    } catch (error) {
      console.error("Error cargando resultados de evaluación:", error)
      // No mostrar toast para este error, es opcional
    } finally {
      setIsLoadingResultados(false)
    }
  }

  const handleLogout = () => {
    authService.removeTokens()
    router.push("/login")
  }

  // Calcular estadísticas globales
  const calcularEstadisticasGlobales = () => {
    if (asignaturas.length === 0) {
      return {
        totalEvaluacionesEsperadas: 0,
        evaluacionesCompletadas: 0,
        evaluacionesPendientes: 0,
        porcentajeCompletado: 0
      }
    }

    const totalEvaluacionesEsperadas = asignaturas.reduce(
      (sum, asig) => sum + asig.total_evaluaciones_esperadas, 0
    )
    const evaluacionesCompletadas = asignaturas.reduce(
      (sum, asig) => sum + asig.evaluaciones_completadas, 0
    )
    const evaluacionesPendientes = totalEvaluacionesEsperadas - evaluacionesCompletadas
    const porcentajeCompletado = totalEvaluacionesEsperadas > 0
      ? (evaluacionesCompletadas / totalEvaluacionesEsperadas) * 100
      : 0

    return {
      totalEvaluacionesEsperadas,
      evaluacionesCompletadas,
      evaluacionesPendientes,
      porcentajeCompletado
    }
  }

  const estadisticasGlobales = calcularEstadisticasGlobales()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-10 w-64" />
          </div>
        </header>
        <main className="container mx-auto p-4 max-w-7xl">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !perfil) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || "No se pudo cargar el perfil"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")}>Volver al inicio</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DocenteHeader
        nombreDocente={perfil.nombre_completo}
        cedulaDocente={perfil.documento}
        sede={perfil.sede}
        onLogout={handleLogout}
      />

      <main className="container mx-auto p-4 max-w-7xl">
        {/* Estadísticas Globales */}
        <div className="mb-6">
          <EstadisticasProgress
            totalEstudiantes={estadisticasGlobales.totalEvaluacionesEsperadas}
            evaluacionesCompletadas={estadisticasGlobales.evaluacionesCompletadas}
            evaluacionesPendientes={estadisticasGlobales.evaluacionesPendientes}
            porcentajeCompletado={estadisticasGlobales.porcentajeCompletado}
          />
        </div>

        {/* Título y descripción */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Panel del Docente</CardTitle>
            <CardDescription>
              {perfil.periodo} • {perfil.sede}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Tabs para Asignaturas, Autoevaluación y Resultados */}
        <Tabs defaultValue="asignaturas" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="asignaturas">Mis Asignaturas</TabsTrigger>
            <TabsTrigger value="autoevaluacion">Autoevaluación</TabsTrigger>
            <TabsTrigger value="resultados">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="asignaturas" className="space-y-4">
            {/* Lista de Asignaturas */}
            {asignaturas.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No tienes asignaturas asignadas en este periodo
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {asignaturas.map((asignatura, index) => (
                  <CardAsignatura
                    key={`${asignatura.COD_ASIGNATURA}-${index}`}
                    codAsignatura={asignatura.COD_ASIGNATURA}
                    nombreAsignatura={asignatura.ASIGNATURA}
                    semestre={asignatura.SEMESTRE_PREDOMINANTE}
                    programa={asignatura.PROGRAMA_PREDOMINANTE}
                    sede={asignatura.NOMBRE_SEDE}
                    grupos={asignatura.grupos}
                    totalEvaluacionesEsperadas={asignatura.total_evaluaciones_esperadas}
                    evaluacionesCompletadas={asignatura.evaluaciones_completadas}
                    porcentajeCompletado={asignatura.porcentaje_completado}
                    idDocente={perfil.documento}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="autoevaluacion" className="space-y-4">
            {/* Autoevaluación del Docente */}
            <AutoevaluacionDocente
              documentoDocente={perfil.documento}
              periodo={perfil.periodo}
              onComplete={() => cargarResultadosEvaluacion(perfil.documento)}
            />
          </TabsContent>

          <TabsContent value="resultados" className="space-y-4">
            {/* Resultados de Evaluación */}
            <ResultadosEvaluacion 
              resultados={resultadosEvaluacion} 
              isLoading={isLoadingResultados}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
