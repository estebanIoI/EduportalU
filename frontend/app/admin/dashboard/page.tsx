"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Download,
  Users,
  GraduationCap,
  ClipboardList,
  TrendingDown,
  User,
  Award,
  Star,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { dashboardService } from "@/services";
import {
  ApiResponse,
  DashboardStatsResponse,
  DashboardAspectosResponse,
  DashboardRankingResponse,
  DashboardPodioResponse,
  DashboardParams,
  EstadisticaProgramaResponse,
  EstudianteEvaluacionResponse,
  DocenteProgramaResponse,
} from "@/lib/types/dashboard/dashboard";
import Filtros from "@/app/admin/components/filters";
import EstadisticasPrograma, { EstudianteEvaluacion, DocentePrograma, AspectoDocente } from "@/app/admin/components/estadisticas-programa";
import apiClient from "@/lib/api";

interface DashboardData {
  stats: DashboardStatsResponse;
  aspectos: DashboardAspectosResponse[];
  ranking: DashboardRankingResponse[];
  podio: DashboardPodioResponse[];
  estadisticasProgramas: EstadisticaProgramaResponse[];
}

interface FiltrosState {
  configuracionSeleccionada: number | null;
  semestreSeleccionado: string;
  periodoSeleccionado: string;
  programaSeleccionado: string;
  grupoSeleccionado: string;
  sedeSeleccionada: string;
}

function extractData<T extends object>(response: T | ApiResponse<T>): T {
  if ("success" in response && "data" in response) {
    return response.data;
  }
  return response;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [loadingBackup, setLoadingBackup] = useState(false);

  const handleBackup = async () => {
    try {
      setLoadingBackup(true);

      // Usar el nuevo método downloadFile
      const response = await apiClient.downloadFile(
        "/backup",
        {},
        { showMessage: false }
      );

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;

      // Usar el filename extraído automáticamente o un fallback
      const fileName = response.filename || "backup.sql";

      link.setAttribute("download", fileName);
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
      console.error("Error al generar el backup:", error);
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
    sedeSeleccionada: "",
  });

  // Estados para datos del dashboard
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  // Cargar datos del dashboard cuando cambian los filtros
  useEffect(() => {
    const cargarDashboard = async () => {
      if (!filtros.configuracionSeleccionada) {
        setDashboardData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const params: DashboardParams = {
          idConfiguracion: filtros.configuracionSeleccionada,
          ...(filtros.semestreSeleccionado && {
            semestre: filtros.semestreSeleccionado,
          }),
          ...(filtros.periodoSeleccionado && {
            periodo: filtros.periodoSeleccionado,
          }),
          ...(filtros.programaSeleccionado && {
            nomPrograma: filtros.programaSeleccionado,
          }),
          ...(filtros.grupoSeleccionado && {
            grupo: filtros.grupoSeleccionado,
          }),
          ...(filtros.sedeSeleccionada && {
            nombreSede: filtros.sedeSeleccionada,
          }),
        };

        const [
          statsResponse,
          aspectosResponse,
          rankingResponse,
          podioResponse,
          estadisticasProgramasResponse,
        ] = await Promise.all([
          dashboardService.getStats(params),
          dashboardService.getAspectos(params),
          dashboardService.getRanking(params),
          dashboardService.getPodio(params),
          dashboardService.getEstadisticasPorPrograma(params),
        ]);

        const statsData = extractData<DashboardStatsResponse>(statsResponse);
        const aspectosData =
          extractData<DashboardAspectosResponse[]>(aspectosResponse);
        const rankingData =
          extractData<DashboardRankingResponse[]>(rankingResponse);
        const podioData = extractData<DashboardPodioResponse[]>(podioResponse);
        const estadisticasProgramasData = 
          extractData<EstadisticaProgramaResponse[]>(estadisticasProgramasResponse);

        const rankingArray = Array.isArray(rankingData) ? rankingData : [];
        const estadisticasProgramas = Array.isArray(estadisticasProgramasData) 
          ? estadisticasProgramasData 
          : [];

        setDashboardData({
          stats: statsData,
          aspectos: Array.isArray(aspectosData) ? aspectosData : [],
          ranking: rankingArray,
          podio: Array.isArray(podioData) ? podioData : [],
          estadisticasProgramas,
        });
      } catch (error) {
        console.error("Error al cargar el dashboard:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del dashboard",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    cargarDashboard();
  }, [filtros, toast]);

  const handleFiltrosChange = (nuevosFiltros: FiltrosState) => {
    setFiltros(nuevosFiltros);
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      ...filtros,
      semestreSeleccionado: "",
      periodoSeleccionado: "",
      programaSeleccionado: "",
      grupoSeleccionado: "",
      sedeSeleccionada: "",
    });
  };

  // Handler para clic en barras del gráfico de estadísticas por programa
  const handleEstadisticasProgramaClick = (
    programa: string,
    tipo: "completadas" | "pendientes"
  ) => {
    console.log(`Clic en ${programa} - ${tipo}`);
    // Aquí puedes agregar lógica adicional como navegar a una vista de detalle
  };

  // Handler para obtener estudiantes de un programa
  const handleObtenerEstudiantesPrograma = async (
    programa: string,
    tipo: "completadas" | "pendientes"
  ): Promise<EstudianteEvaluacion[]> => {
    if (!filtros.configuracionSeleccionada) {
      return [];
    }

    try {
      const params: DashboardParams & { nomPrograma: string; estado: "completadas" | "pendientes" } = {
        idConfiguracion: filtros.configuracionSeleccionada,
        nomPrograma: programa,
        estado: tipo,
        ...(filtros.semestreSeleccionado && { semestre: filtros.semestreSeleccionado }),
        ...(filtros.periodoSeleccionado && { periodo: filtros.periodoSeleccionado }),
        ...(filtros.grupoSeleccionado && { grupo: filtros.grupoSeleccionado }),
        ...(filtros.sedeSeleccionada && { nombreSede: filtros.sedeSeleccionada }),
      };

      const response = await dashboardService.getEstudiantesPorPrograma(params);
      const data = extractData<EstudianteEvaluacionResponse[]>(response);
      
      // Mapear la respuesta al tipo esperado por el componente
      return (data || []).map((est): EstudianteEvaluacion => ({
        id: est.id,
        nombre: est.nombre,
        codigo: est.codigo,
        estado: est.estado,
        fechaCompletado: est.fechaCompletado || undefined,
      }));
    } catch (error) {
      console.error("Error al obtener estudiantes:", error);
      return [];
    }
  };

  // Handler para obtener docentes de un programa
  const handleObtenerDocentesPrograma = async (
    programa: string
  ): Promise<DocentePrograma[]> => {
    if (!filtros.configuracionSeleccionada) {
      return [];
    }

    try {
      const params: DashboardParams & { nomPrograma: string } = {
        idConfiguracion: filtros.configuracionSeleccionada,
        nomPrograma: programa,
        ...(filtros.semestreSeleccionado && { semestre: filtros.semestreSeleccionado }),
        ...(filtros.periodoSeleccionado && { periodo: filtros.periodoSeleccionado }),
        ...(filtros.grupoSeleccionado && { grupo: filtros.grupoSeleccionado }),
        ...(filtros.sedeSeleccionada && { nombreSede: filtros.sedeSeleccionada }),
      };

      const response = await dashboardService.getDocentesPorPrograma(params);
      const data = extractData<DocenteProgramaResponse[]>(response);
      
      // Mapear la respuesta al tipo esperado por el componente
      return (data || []).map((doc): DocentePrograma => ({
        id: doc.id,
        nombre: doc.nombre,
        promedio: doc.promedio,
        estado: doc.estado,
        evaluacionesRealizadas: doc.evaluacionesRealizadas,
        evaluacionesEsperadas: doc.evaluacionesEsperadas,
        porcentajeEvaluado: doc.porcentajeEvaluado,
        totalEstudiantes: doc.totalEstudiantes,
        totalAsignaturas: doc.totalAsignaturas,
        posicion: doc.posicion,
        aspectos: doc.aspectos?.map(a => ({
          aspecto: a.aspecto,
          descripcion: a.descripcion,
          promedio: a.promedio
        })),
        aspectosAMejorar: doc.aspectosAMejorar?.map(a => ({
          aspecto: a.aspecto,
          descripcion: a.descripcion,
          promedio: a.promedio
        })),
      }));
    } catch (error) {
      console.error("Error al obtener docentes:", error);
      return [];
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const formatNumber = (value: number | string | undefined | null) => {
    if (value === undefined || value === null) return "0.0";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "0.0";
    return numValue.toFixed(1);
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return "bg-green-500";
    if (value >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Preparar datos para mostrar
  const stats = dashboardData?.stats;
  const aspectos = dashboardData?.aspectos || [];
  const ranking = dashboardData?.ranking || [];
  const podio = dashboardData?.podio || [];
  const estadisticasProgramas = dashboardData?.estadisticasProgramas || [];

  // Usar ranking para el listado completo ordenado por promedio
  const docentesOrdenados = [...ranking].sort((a, b) => {
    const promedioA = parseFloat(a.PROMEDIO_GENERAL?.toString() || "0");
    const promedioB = parseFloat(b.PROMEDIO_GENERAL?.toString() || "0");
    return promedioB - promedioA;
  });

  // Si podio tiene datos específicos para mejores/peores, usarlos
  // Si no, usar los datos del ranking ordenado
  const mejoresDocentes =
    podio.length > 0 ? podio.slice(0, 3) : docentesOrdenados.slice(0, 3);
  const peoresDocentes =
    podio.length > 0
      ? [...podio].reverse().slice(0, 3)
      : [...docentesOrdenados].reverse().slice(0, 3);

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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Selecciona una configuración
              </h2>
              <p className="text-gray-600">
                Elige una configuración de evaluación para ver los datos del
                dashboard
              </p>
            </div>
          </div>
        ) : !dashboardData ? (
          <div className="min-h-[400px] bg-gray-50 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No hay datos disponibles
              </h2>
              <p className="text-gray-600">
                No se encontraron datos para los filtros seleccionados
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Estudiantes */}
              <Card className="relative rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
                <Users className="absolute top-4 right-4 w-10 h-10 text-indigo-400/30" />
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm uppercase text-gray-500 tracking-wide">
                    Estudiantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-extrabold text-gray-900 tracking-tight">
                    {stats?.total_estudiantes || 0}
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Evaluaciones Completadas</span>
                      <span>
                        {stats?.estudiantes_completados || 0} /{" "}
                        {stats?.total_estudiantes || 0}
                      </span>
                    </div>
                    <div className="relative h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full transition-all duration-700 ease-out ${getProgressColor(
                          ((stats?.estudiantes_completados || 0) /
                            (stats?.total_estudiantes || 1)) *
                            100
                        )}`}
                        style={{
                          width: `${
                            ((stats?.estudiantes_completados || 0) /
                              (stats?.total_estudiantes || 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="text-xs mt-1 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {Math.round(
                          ((stats?.estudiantes_completados || 0) /
                            (stats?.total_estudiantes || 1)) *
                            100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Docentes */}
              <Card className="relative rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
                <GraduationCap className="absolute top-4 right-4 w-10 h-10 text-indigo-400/30" />
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm uppercase text-gray-500 tracking-wide">
                    Docentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-extrabold text-gray-900 tracking-tight">
                    {stats?.total_docentes || 0}
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Docentes Evaluados</span>
                      <span>
                        {stats?.docentes_evaluados || 0} /{" "}
                        {stats?.total_docentes || 0}
                      </span>
                    </div>
                    <div className="relative h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full transition-all duration-700 ease-out ${getProgressColor(
                          ((stats?.docentes_evaluados || 0) /
                            (stats?.total_docentes || 1)) *
                            100
                        )}`}
                        style={{
                          width: `${
                            ((stats?.docentes_evaluados || 0) /
                              (stats?.total_docentes || 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="text-xs mt-1 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {Math.round(
                          ((stats?.docentes_evaluados || 0) /
                            (stats?.total_docentes || 1)) *
                            100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Evaluaciones */}
              <Card className="relative rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
                <ClipboardList className="absolute top-4 right-4 w-10 h-10 text-indigo-400/30" />
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm uppercase text-gray-500 tracking-wide">
                    Evaluaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-extrabold text-gray-900 tracking-tight">
                    {stats?.total_evaluaciones || 0}
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Por Realizar</span>
                      <span>
                        {stats?.evaluaciones_completadas || 0} /{" "}
                        {stats?.total_evaluaciones || 0}
                      </span>
                    </div>
                    <div className="relative h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full transition-all duration-700 ease-out ${getProgressColor(
                          ((stats?.evaluaciones_completadas || 0) /
                            (stats?.total_evaluaciones || 1)) *
                            100
                        )}`}
                        style={{
                          width: `${
                            ((stats?.evaluaciones_completadas || 0) /
                              (stats?.total_evaluaciones || 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="text-xs mt-1 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {Math.round(
                          ((stats?.evaluaciones_completadas || 0) /
                            (stats?.total_evaluaciones || 1)) *
                            100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Estadísticas por Programa */}
            <div className="mb-10">
              <EstadisticasPrograma
                datos={estadisticasProgramas.length > 0 ? estadisticasProgramas : undefined}
                onBarClick={handleEstadisticasProgramaClick}
                onObtenerEstudiantes={handleObtenerEstudiantesPrograma}
                onObtenerDocentes={handleObtenerDocentesPrograma}
                loading={loading}
              />
            </div>

            {/* Ranking y Mejores/Peores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Ranking Global - Tamaño Aumentado */}
              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-800">
                        Ranking Global de Docentes
                      </CardTitle>
                      <CardDescription className="text-gray-500 text-base mt-1">
                        Evaluación integral del cuerpo docente
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-50">
                    {docentesOrdenados.map((docente, index) => (
                      <div
                        key={`ranking-${
                          docente.ID_DOCENTE || "no-id"
                        }-${index}`}
                        className="group flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors duration-200 shadow-sm hover:shadow-md"
                      >
                        {/* Posición */}
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold 
              ${
                index < 3
                  ? "bg-blue-100 text-blue-800 shadow-md"
                  : "bg-gray-100 text-gray-600"
              }`}
                        >
                          {index + 1}
                        </div>

                        {/* Avatar */}
                        <div
                          className={`h-12 w-12 rounded-full flex items-center justify-center shadow-inner
              ${
                index < 3
                  ? "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600"
                  : "bg-gray-100 text-gray-400"
              }`}
                        >
                          <User className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-800 truncate">
                              {docente.DOCENTE}
                            </h3>
                            <span className="text-base font-bold text-gray-700 ml-2 px-3 py-1 bg-gray-100 rounded-full">
                              {formatNumber(
                                (docente.PROMEDIO_GENERAL || 0) * 100
                              )}
                              %
                            </span>
                          </div>

                          {/* Barra de progreso mejorada */}
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700
                  ${
                    index < 3
                      ? "bg-gradient-to-r from-blue-400 to-blue-600"
                      : "bg-gradient-to-r from-gray-300 to-gray-400"
                  }`}
                              style={{
                                width: `${
                                  (docente.PROMEDIO_GENERAL || 0) * 100
                                }%`,
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>
                              {docente.EVALUACIONES_REALIZADAS || 0}/
                              {docente.EVALUACIONES_ESPERADAS || 0} evaluaciones
                            </span>
                            <span className="px-2 py-1 bg-gray-50 rounded-full text-xs font-medium">
                              {Math.round(
                                ((docente.EVALUACIONES_REALIZADAS || 0) /
                                  (docente.EVALUACIONES_ESPERADAS || 1)) *
                                  100
                              )}
                              % completado
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {docentesOrdenados.length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        <User className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="text-base font-medium">
                          No hay datos disponibles
                        </p>
                        <p className="text-sm mt-2">
                          Los resultados aparecerán después del proceso de
                          evaluación
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Mejores y Peores - Tamaño Aumentado */}
              <div className="space-y-6">
                {/* Mejores */}
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                  <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-white border-b border-green-100">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center shadow-sm">
                        <Award className="h-6 w-6 text-green-700" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold text-gray-800">
                          Excelencia Docente
                        </CardTitle>
                        <CardDescription className="text-green-600 text-base mt-1">
                          Top 3 con mejor desempeño académico
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {mejoresDocentes.map((docente, index) => (
                        <div
                          key={`mejor-${
                            docente.ID_DOCENTE || "no-id"
                          }-${index}`}
                          className="group relative flex items-center gap-4 p-4 rounded-xl bg-white border border-green-50 hover:border-green-200 hover:bg-green-50 transition-colors duration-200 shadow-sm hover:shadow-md"
                        >
                          {/* Medalla de posición */}
                          <div
                            className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg
                ${
                  index === 0
                    ? "bg-yellow-500"
                    : index === 1
                    ? "bg-gray-400"
                    : "bg-amber-600"
                }`}
                          >
                            {index + 1}
                          </div>

                          {/* Avatar con efecto premium */}
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-green-700 shadow-inner group-hover:rotate-6 transition-transform duration-300">
                            {index === 0 ? (
                              <Award className="h-6 w-6" />
                            ) : (
                              <Star className="h-5 w-5 fill-green-300" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-semibold text-gray-800 truncate">
                                {docente.DOCENTE}
                              </h3>
                              <span className="text-base font-bold text-green-700 px-3 py-1 bg-green-100 rounded-full">
                                {formatNumber(
                                  (docente.PROMEDIO_GENERAL || 0) * 100
                                )}
                                %
                              </span>
                            </div>

                            {/* Indicador de calidad */}
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-500">
                                {docente.EVALUACIONES_REALIZADAS || 0}{" "}
                                evaluaciones
                              </div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i <
                                      Math.floor(
                                        (docente.PROMEDIO_GENERAL || 0) * 5
                                      )
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "fill-gray-200 text-gray-200"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {mejoresDocentes.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="text-base font-medium">
                            No hay datos disponibles
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Peores */}
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                  <CardHeader className="pb-4 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center shadow-sm">
                        <AlertCircle className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold text-gray-800">
                          Oportunidades de Mejora
                        </CardTitle>
                        <CardDescription className="text-orange-600 text-base mt-1">
                          Docentes que requieren apoyo adicional
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {peoresDocentes.map((docente, index) => (
                        <div
                          key={`peor-${docente.ID_DOCENTE || "no-id"}-${index}`}
                          className="group relative flex items-center gap-4 p-4 rounded-xl bg-white border border-orange-50 hover:border-orange-200 hover:bg-orange-50 transition-colors duration-200 shadow-sm hover:shadow-md"
                        >
                          {/* Indicador de prioridad */}
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />

                          {/* Avatar con indicador */}
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-600 shadow-inner">
                            <AlertTriangle className="h-5 w-5" />
                          </div>

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-semibold text-gray-800 truncate">
                                {docente.DOCENTE}
                              </h3>
                              <span className="text-base font-bold text-orange-700 px-3 py-1 bg-orange-100 rounded-full">
                                {formatNumber(
                                  (docente.PROMEDIO_GENERAL || 0) * 100
                                )}
                                %
                              </span>
                            </div>

                            {/* Indicador de progreso */}
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-500">
                                {docente.EVALUACIONES_REALIZADAS || 0}{" "}
                                evaluaciones
                              </div>
                              <div className="flex items-center gap-1 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                <AlertCircle className="h-4 w-4" />
                                <span>Necesita refuerzo</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {peoresDocentes.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="text-base font-medium">
                            No hay datos disponibles
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Aspectos Evaluados */}
{/* Aspectos Evaluados - Tamaño Ajustado */}
            <Card className="rounded-2xl border border-gray-200 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Aspectos Evaluados
                </CardTitle>
                <CardDescription className="text-base text-gray-600 mt-1">
                  Promedio por aspecto evaluado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {aspectos.map((aspecto, index) => {
                    const porcentaje = (aspecto.PROMEDIO_GENERAL || 0) * 100;
                    const progressColor = getProgressColor(porcentaje); // Debe retornar algo como 'bg-green-500'

                    return (
                      <div key={aspecto.ASPECTO || index} className="group p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 border border-gray-100 hover:border-gray-200">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-base font-medium text-gray-800">
                              {aspecto.ASPECTO}
                            </span>
                            <span className={`text-base font-bold px-3 py-1 rounded-full
                              ${porcentaje >= 80 ? 'bg-green-100 text-green-800' : 
                                porcentaje >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'}`}>
                              {formatNumber(porcentaje)}%
                            </span>
                          </div>
                          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full ${progressColor} transition-all duration-700 ease-out rounded-full shadow-sm`}
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                          {/* Indicador de rendimiento */}
                          <div className="flex justify-between items-center">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
                              ${porcentaje >= 80 ? 'bg-green-50 text-green-700' : 
                                porcentaje >= 60 ? 'bg-yellow-50 text-yellow-700' : 
                                'bg-red-50 text-red-700'}`}>
                              {porcentaje >= 80 ? (
                                <>
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Excelente</span>
                                </>
                              ) : porcentaje >= 60 ? (
                                <>
                                  <AlertCircle className="h-4 w-4" />
                                  <span>Bueno</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>Necesita mejora</span>
                                </>
                              )}
                            </div>
                            
                            {/* Estrellas de calificación */}
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 transition-colors duration-200 ${
                                    i < Math.floor((porcentaje / 100) * 5)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "fill-gray-200 text-gray-200"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {aspectos.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-base font-medium">
                        No hay datos de aspectos disponibles
                      </p>
                      <p className="text-sm mt-2">
                        Los aspectos aparecerán una vez completadas las evaluaciones
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </>
  );
}
