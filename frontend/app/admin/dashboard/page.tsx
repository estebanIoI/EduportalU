"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { dashboardService } from "@/services"
import { ApiResponse, DashboardStatsResponse, DashboardAspectosResponse, DashboardRankingResponse, DashboardPodioResponse, DashboardParams } from "@/lib/types/dashboard/dashboard"
import Filtros from "@/app/admin/components/filters"
import apiClient from "@/lib/api"

interface DashboardData {
  stats: DashboardStatsResponse
  aspectos: DashboardAspectosResponse[]
  ranking: DashboardRankingResponse[]
  podio: DashboardPodioResponse[]
}

interface FiltrosState {
  configuracionSeleccionada: number | null
  semestreSeleccionado: string
  periodoSeleccionado: string
  programaSeleccionado: string
  grupoSeleccionado: string
  sedeSeleccionada: string
}

function extractData<T extends object>(response: T | ApiResponse<T>): T {
  if ('success' in response && 'data' in response) {
    return response.data
  }
  return response
}

export default function AdminDashboard() {
  const { toast } = useToast()
  const [loadingBackup, setLoadingBackup] = useState(false)

  const handleBackup = async () => {
  try {
        setLoadingBackup(true);
        
        // Usar el nuevo método downloadFile
        const response = await apiClient.downloadFile('/backup', {}, { showMessage: false });

        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        
        // Usar el filename extraído automáticamente o un fallback
        const fileName = response.filename || 'backup.sql';
        
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Backup generado",
          description: "El archivo de backup se ha descargado correctamente",
          variant: "default",
        });
        
    } catch (error) {
      console.error('Error al generar el backup:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el backup",
        variant: "destructive",
      });
    } finally {
      setLoadingBackup(false);
    }
  };

  // Estados para filtros
  const [filtros, setFiltros] = useState<FiltrosState>({
    configuracionSeleccionada: null,
    semestreSeleccionado: "",
    periodoSeleccionado: "",
    programaSeleccionado: "",
    grupoSeleccionado: "",
    sedeSeleccionada: ""
  })

  // Estados para datos del dashboard
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)

  // Cargar datos del dashboard cuando cambian los filtros
  useEffect(() => {
    const cargarDashboard = async () => {
      if (!filtros.configuracionSeleccionada) {
        setDashboardData(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const params: DashboardParams = {
          idConfiguracion: filtros.configuracionSeleccionada,
          ...(filtros.semestreSeleccionado && { semestre: filtros.semestreSeleccionado }),
          ...(filtros.periodoSeleccionado && { periodo: filtros.periodoSeleccionado }),
          ...(filtros.programaSeleccionado && { nomPrograma: filtros.programaSeleccionado }),
          ...(filtros.grupoSeleccionado && { grupo: filtros.grupoSeleccionado }),
          ...(filtros.sedeSeleccionada && { nombreSede: filtros.sedeSeleccionada })
        }

        const [statsResponse, aspectosResponse, rankingResponse, podioResponse] = await Promise.all([
          dashboardService.getStats(params),
          dashboardService.getAspectos(params),
          dashboardService.getRanking(params),
          dashboardService.getPodio(params)
        ])

        const statsData = extractData<DashboardStatsResponse>(statsResponse)
        const aspectosData = extractData<DashboardAspectosResponse[]>(aspectosResponse)
        const rankingData = extractData<DashboardRankingResponse[]>(rankingResponse)
        const podioData = extractData<DashboardPodioResponse[]>(podioResponse)

        setDashboardData({
          stats: statsData,
          aspectos: Array.isArray(aspectosData) ? aspectosData : [],
          ranking: Array.isArray(rankingData) ? rankingData : [],
          podio: Array.isArray(podioData) ? podioData : []
        })

      } catch (error) {
        console.error('Error al cargar el dashboard:', error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del dashboard",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    cargarDashboard()
  }, [filtros, toast])

  const handleFiltrosChange = (nuevosFiltros: FiltrosState) => {
    setFiltros(nuevosFiltros)
  }

  const handleLimpiarFiltros = () => {
    setFiltros({
      ...filtros,
      semestreSeleccionado: "",
      periodoSeleccionado: "",
      programaSeleccionado: "",
      grupoSeleccionado: "",
      sedeSeleccionada: ""
    })
  }

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const formatNumber = (value: number | string | undefined | null) => {
    if (value === undefined || value === null) return '0.0'
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return '0.0'
    return numValue.toFixed(1)
  }

  const getProgressColor = (value: number) => {
    if (value >= 80) return "bg-green-500"
    if (value >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Preparar datos para mostrar
  const stats = dashboardData?.stats
  const aspectos = dashboardData?.aspectos || []
  const ranking = dashboardData?.ranking || []
  const podio = dashboardData?.podio || []

  // Usar ranking para el listado completo ordenado por promedio
  const docentesOrdenados = [...ranking].sort((a, b) => {
    const promedioA = parseFloat(a.PROMEDIO_GENERAL?.toString() || '0')
    const promedioB = parseFloat(b.PROMEDIO_GENERAL?.toString() || '0')
    return promedioB - promedioA
  })

  // Si podio tiene datos específicos para mejores/peores, usarlos
  // Si no, usar los datos del ranking ordenado
  const mejoresDocentes = podio.length > 0 
    ? podio.slice(0, 3) 
    : docentesOrdenados.slice(0, 3)
  const peoresDocentes = podio.length > 0
    ? [...podio].reverse().slice(0, 3)
    : [...docentesOrdenados].reverse().slice(0, 3)

  return (
    <>
      <header className="bg-white p-4 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-gray-900 text-gray-900 hover:bg-gray-100"
            onClick={handleBackup}
            disabled={loadingBackup}
          >
            <Download className="h-4 w-4 mr-2" />
            {loadingBackup ? "Generando backup..." : "Backup"}
          </Button>
        </div>
      </header>

      <main className="p-6">
        {/* Componente de Filtros */}
        <Filtros
          filtros={filtros}
          onFiltrosChange={handleFiltrosChange}
          onLimpiarFiltros={handleLimpiarFiltros}
          loading={loading}
        />

        {/* Contenido del Dashboard */}
        {!filtros.configuracionSeleccionada ? (
          <div className="min-h-[400px] bg-gray-50 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Selecciona una configuración</h2>
              <p className="text-gray-600">Elige una configuración de evaluación para ver los datos del dashboard</p>
            </div>
          </div>
        ) : !dashboardData ? (
          <div className="min-h-[400px] bg-gray-50 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay datos disponibles</h2>
              <p className="text-gray-600">No se encontraron datos para los filtros seleccionados</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-900">Total de Estudiantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-gray-900">{stats?.total_estudiantes || 0}</div>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>Evaluaciones Completadas</span>
                      <span>{stats?.evaluaciones_completadas || 0} de {stats?.total_evaluaciones || 0}</span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div 
                        className={`h-full ${getProgressColor((stats?.evaluaciones_completadas || 0) / (stats?.total_evaluaciones || 1) * 100)}`}
                        style={{ width: `${(stats?.evaluaciones_completadas || 0) / (stats?.total_evaluaciones || 1) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-900">Total de Docentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-gray-900">{stats?.total_docentes || 0}</div>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>Docentes Evaluados</span>
                      <span>{stats?.docentes_evaluados || 0} de {stats?.total_docentes || 0}</span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div 
                        className={`h-full ${getProgressColor((stats?.docentes_evaluados || 0) / (stats?.total_docentes || 1) * 100)}`}
                        style={{ width: `${(stats?.docentes_evaluados || 0) / (stats?.total_docentes || 1) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-900">Evaluaciones Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-gray-900">{stats?.evaluaciones_pendientes || 0}</div>
                  <p className="text-sm text-gray-500">Evaluaciones por realizar</p>
                </CardContent>
              </Card>
            </div>

            {/* Ranking y Mejores/Peores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900">Ranking Global de Docentes</CardTitle>
                  <CardDescription className="text-gray-600">Lista completa de docentes evaluados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {docentesOrdenados.map((docente, index) => (
                      <div 
                        key={`ranking-${docente.ID_DOCENTE || 'no-id'}-${index}`} 
                        className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 border border-gray-200"
                      >
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-600">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">{docente.DOCENTE}</h3>
                            <span className="text-lg font-bold text-gray-600">
                              {formatNumber((docente.PROMEDIO_GENERAL || 0) * 100)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-sm text-gray-500">
                                {docente.evaluaciones_realizadas || 0} de {docente.evaluaciones_esperadas || 0} evaluaciones
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {docentesOrdenados.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No hay datos de ranking disponibles
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-900">Mejor Desempeño</CardTitle>
                    <CardDescription className="text-gray-600">Top 3 docentes mejor evaluados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mejoresDocentes.map((docente, index) => (
                        <div 
                          key={`mejor-${docente.ID_DOCENTE || 'no-id'}-${index}`} 
                          className="flex items-center gap-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200"
                        >
                          <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                            <span className="text-xl font-bold text-yellow-600">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-gray-900">{docente.DOCENTE}</h3>
                              <span className="text-lg font-bold text-yellow-600">
                                {formatNumber((docente.PROMEDIO_GENERAL || 0) * 100)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-sm text-gray-500">
                                  {docente.evaluaciones_realizadas || 0} de {docente.evaluaciones_esperadas || 0} evaluaciones
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {mejoresDocentes.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No hay datos disponibles
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-gray-900">Peor Desempeño</CardTitle>
                    <CardDescription className="text-gray-600">3 docentes con menor evaluación</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {peoresDocentes.map((docente, index) => (
                        <div 
                          key={`peor-${docente.ID_DOCENTE || 'no-id'}-${index}`} 
                          className="flex items-center gap-4 p-4 rounded-lg bg-red-50 border border-red-200"
                        >
                          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-xl font-bold text-red-600">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-gray-900">{docente.DOCENTE}</h3>
                              <span className="text-lg font-bold text-red-600">
                                {formatNumber((docente.PROMEDIO_GENERAL || 0) * 100)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-500">
                                  {docente.evaluaciones_realizadas || 0} de {docente.evaluaciones_esperadas || 0} evaluaciones
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {peoresDocentes.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No hay datos disponibles
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Aspectos Evaluados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">Aspectos Evaluados</CardTitle>
                <CardDescription className="text-gray-600">Promedio por aspecto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aspectos.map((aspecto, index) => {
                    const porcentaje = (aspecto.PROMEDIO_GENERAL || 0) * 100
                    const progressColor = getProgressColor(porcentaje)

                    return (
                      <div key={aspecto.ASPECTO || index} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-900">{aspecto.ASPECTO}</span>
                          <span className="text-gray-900 font-medium">{formatNumber(porcentaje)}%</span>
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div 
                            className={`h-full ${getProgressColor(porcentaje)}`}
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {aspectos.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No hay datos de aspectos disponibles
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </>
  )
}