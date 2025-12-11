"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Users,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  User,
} from "lucide-react";

// Tipos para el componente
export interface EstadisticaPrograma {
  programa: string;
  programaCorto?: string;
  completadas: number;
  pendientes: number;
  total: number;
  porcentajeCompletado: number;
  totalEstudiantes?: number;
}

export interface EstudianteEvaluacion {
  id: string;
  nombre: string;
  codigo: string;
  estado: "completada" | "pendiente";
  fechaCompletado?: string;
}

export interface DocentePrograma {
  id: string;
  nombre: string;
  promedio: string;
  estado: "excelente" | "bueno" | "regular" | "necesita_mejora" | "sin_evaluar";
  evaluacionesRealizadas: number;
  evaluacionesEsperadas: number;
  porcentajeEvaluado: number;
  totalEstudiantes: number;
  totalAsignaturas: number;
  posicion: number;
  aspectos?: AspectoDocente[];
  aspectosAMejorar?: AspectoDocente[];
}

export interface AspectoDocente {
  aspecto: string;
  descripcion: string;
  promedio: string;
}

interface EstadisticasProgramaProps {
  datos?: EstadisticaPrograma[];
  onBarClick?: (
    programa: string,
    tipo: "completadas" | "pendientes"
  ) => void;
  onObtenerEstudiantes?: (
    programa: string,
    tipo: "completadas" | "pendientes"
  ) => Promise<EstudianteEvaluacion[]>;
  onObtenerDocentes?: (
    programa: string
  ) => Promise<DocentePrograma[]>;
  loading?: boolean;
}

// Configuración del gráfico
const chartConfig: ChartConfig = {
  completadas: {
    label: "Completadas",
    color: "hsl(221, 83%, 53%)", // Azul
  },
  pendientes: {
    label: "Pendientes",
    color: "hsl(220, 9%, 46%)", // Gris
  },
};

export default function EstadisticasPrograma({
  datos,
  onBarClick,
  onObtenerEstudiantes,
  onObtenerDocentes,
  loading = false,
}: EstadisticasProgramaProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<{
    programa: string;
    tipo: "completadas" | "pendientes";
    estudiantes: EstudianteEvaluacion[];
    docentes: DocentePrograma[];
    loading: boolean;
    view: "docentes" | "estudiantes";
  }>({
    programa: "",
    tipo: "completadas",
    estudiantes: [],
    docentes: [],
    loading: false,
    view: "docentes",
  });

  // Usar datos proporcionados (datos reales del backend)
  const estadisticas: EstadisticaPrograma[] = datos && datos.length > 0 ? datos : [];

  // Preparar datos para el gráfico
  const chartData = useMemo(() => {
    return estadisticas.map((item: EstadisticaPrograma) => ({
      name: item.programaCorto || item.programa,
      programaCompleto: item.programa,
      completadas: item.completadas,
      pendientes: item.pendientes,
      total: item.total,
      porcentaje: item.porcentajeCompletado,
    }));
  }, [estadisticas]);

  // Calcular totales
  const totales = useMemo(() => {
    return estadisticas.reduce(
      (acc: { completadas: number; pendientes: number; total: number }, item: EstadisticaPrograma) => ({
        completadas: acc.completadas + item.completadas,
        pendientes: acc.pendientes + item.pendientes,
        total: acc.total + item.total,
      }),
      { completadas: 0, pendientes: 0, total: 0 }
    );
  }, [estadisticas]);

  // Handler para clic en barras
  const handleBarClick = async (
    programa: string,
    tipo: "completadas" | "pendientes"
  ) => {
    // Callback externo
    onBarClick?.(programa, tipo);

    // Abrir diálogo mostrando docentes
    setDialogData({
      programa,
      tipo,
      estudiantes: [],
      docentes: [],
      loading: true,
      view: "docentes",
    });
    setDialogOpen(true);

    // Obtener docentes si hay función proporcionada
    if (onObtenerDocentes) {
      try {
        const docentes = await onObtenerDocentes(programa);
        if (docentes && Array.isArray(docentes) && docentes.length > 0) {
          setDialogData((prev) => ({
            ...prev,
            docentes,
            loading: false,
          }));
        } else {
          setDialogData((prev) => ({
            ...prev,
            docentes: [],
            loading: false,
          }));
        }
      } catch (error) {
        console.error("Error al obtener docentes:", error);
        setDialogData((prev) => ({
          ...prev,
          docentes: [],
          loading: false,
        }));
      }
    } else {
      setDialogData((prev) => ({
        ...prev,
        docentes: [],
        loading: false,
      }));
    }
  };

  // Helper para obtener color e icono del estado
  const getEstadoInfo = (estado: DocentePrograma["estado"]) => {
    switch (estado) {
      case "excelente":
        return {
          color: "bg-green-100 text-green-700 border-green-200",
          icon: <Star className="h-4 w-4" />,
          label: "Excelente",
          bgGradient: "from-green-50 to-green-100",
        };
      case "bueno":
        return {
          color: "bg-blue-100 text-blue-700 border-blue-200",
          icon: <TrendingUp className="h-4 w-4" />,
          label: "Bueno",
          bgGradient: "from-blue-50 to-blue-100",
        };
      case "regular":
        return {
          color: "bg-yellow-100 text-yellow-700 border-yellow-200",
          icon: <AlertTriangle className="h-4 w-4" />,
          label: "Regular",
          bgGradient: "from-yellow-50 to-yellow-100",
        };
      case "necesita_mejora":
        return {
          color: "bg-red-100 text-red-700 border-red-200",
          icon: <TrendingDown className="h-4 w-4" />,
          label: "Necesita Mejora",
          bgGradient: "from-red-50 to-red-100",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-600 border-gray-200",
          icon: <Clock className="h-4 w-4" />,
          label: "Sin Evaluar",
          bgGradient: "from-gray-50 to-gray-100",
        };
    }
  };

  // Helper para obtener color del promedio
  const getPromedioColor = (promedio: number) => {
    if (promedio >= 4.0) return "text-green-600";
    if (promedio >= 3.5) return "text-blue-600";
    if (promedio >= 3.0) return "text-yellow-600";
    if (promedio > 0) return "text-red-600";
    return "text-gray-400";
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
          <p className="font-semibold text-gray-900 mb-2 border-b pb-2">
            {data?.programaCompleto || label}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Completadas</span>
              </div>
              <span className="font-semibold text-gray-900">
                {data?.completadas}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-sm text-gray-600">Pendientes</span>
              </div>
              <span className="font-semibold text-gray-900">
                {data?.pendientes}
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <span className="font-semibold text-gray-900">
                  {data?.total}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-600">Progreso</span>
                <span className="font-semibold text-blue-600">
                  {data?.porcentaje}%
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border border-gray-200 shadow-lg bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Estadísticas por Programa
              </CardTitle>
              <CardDescription className="text-gray-500">
                Cargando datos...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-2xl border border-gray-200 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Estadísticas por Programa
                </CardTitle>
                <CardDescription className="text-gray-500 mt-1">
                  {estadisticas.length > 0 
                    ? "Haz clic en las barras para ver el detalle de estudiantes"
                    : "Seleccione una configuración para ver las estadísticas"}
                </CardDescription>
              </div>
            </div>

            {/* Resumen rápido */}
            {estadisticas.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    {totales.completadas} completadas
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600">
                    {totales.pendientes} pendientes
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {estadisticas.length === 0 ? (
            /* Mensaje cuando no hay datos */
            <div className="h-[400px] flex flex-col items-center justify-center text-gray-400">
              <BarChart3 className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium text-gray-500">
                No hay datos de programas disponibles
              </p>
              <p className="text-sm mt-2 text-gray-400">
                Las estadísticas aparecerán cuando se carguen los datos
              </p>
            </div>
          ) : (
            <>
              {/* Gráfico */}
              <div className="h-[400px] w-full">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    barGap={8}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value.toString()}
                    />
                    <ChartTooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="completadas"
                      fill="hsl(221, 83%, 53%)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                      cursor="pointer"
                      onClick={(data) =>
                        handleBarClick(data.programaCompleto, "completadas")
                      }
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={`completadas-${index}`}
                          className="hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="pendientes"
                      fill="hsl(220, 9%, 46%)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                      cursor="pointer"
                      onClick={(data) =>
                        handleBarClick(data.programaCompleto, "pendientes")
                      }
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={`pendientes-${index}`}
                          className="hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>

              {/* Leyenda */}
              <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Evaluaciones Completadas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-400"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Evaluaciones Pendientes
                  </span>
                </div>
              </div>

              {/* Cards de resumen por programa (responsive) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {estadisticas.map((programa, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group"
                    onClick={() => handleBarClick(programa.programa, "completadas")}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      <span className="text-xs font-medium text-gray-500 truncate">
                        {programa.programaCorto || programa.programa}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {programa.porcentajeCompletado}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {programa.completadas}/{programa.total}
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          programa.porcentajeCompletado >= 80
                            ? "bg-green-100 text-green-700"
                            : programa.porcentajeCompletado >= 60
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {programa.porcentajeCompletado >= 80
                          ? "Alto"
                          : programa.porcentajeCompletado >= 60
                          ? "Medio"
                          : "Bajo"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de detalle de docentes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <span className="text-lg">Rendimiento de Docentes</span>
                <p className="text-sm font-normal text-gray-500 mt-1">
                  {dialogData.programa}
                </p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Listado de docentes con su promedio de evaluación y estado de desempeño
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            {dialogData.loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : dialogData.docentes && dialogData.docentes.length > 0 ? (
              <div className="space-y-3">
                {dialogData.docentes.map((docente) => {
                  const estadoInfo = getEstadoInfo(docente.estado);
                  const promedio = parseFloat(docente.promedio);
                  
                  return (
                    <div
                      key={docente.id}
                      className={`p-4 rounded-xl border transition-all hover:shadow-md bg-gradient-to-r ${estadoInfo.bgGradient}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Posición */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-700">
                              {docente.posicion}
                            </span>
                          </div>
                          
                          {/* Información del docente */}
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {docente.nombre}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  {docente.totalEstudiantes} estudiantes
                                </span>
                                <span className="flex items-center gap-1">
                                  <GraduationCap className="h-3.5 w-3.5" />
                                  {docente.totalAsignaturas} asignaturas
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Métricas */}
                        <div className="flex items-center gap-4">
                          {/* Progreso de evaluaciones */}
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Evaluaciones</p>
                            <p className="text-sm font-medium text-gray-700">
                              {docente.evaluacionesRealizadas}/{docente.evaluacionesEsperadas}
                              <span className="text-xs text-gray-400 ml-1">
                                ({docente.porcentajeEvaluado}%)
                              </span>
                            </p>
                          </div>

                          {/* Promedio */}
                          <div className="text-center px-4 py-2 bg-white rounded-lg shadow-sm min-w-[80px]">
                            <p className={`text-2xl font-bold ${getPromedioColor(promedio)}`}>
                              {docente.promedio}
                            </p>
                            <p className="text-xs text-gray-400">Promedio</p>
                          </div>

                          {/* Badge de estado */}
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${estadoInfo.color}`}>
                            {estadoInfo.icon}
                            <span className="text-sm font-medium">
                              {estadoInfo.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Barra de progreso del promedio */}
                      <div className="mt-3 pt-3 border-t border-gray-200/50">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200/70 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                promedio >= 4.0 ? 'bg-green-500' :
                                promedio >= 3.5 ? 'bg-blue-500' :
                                promedio >= 3.0 ? 'bg-yellow-500' :
                                promedio > 0 ? 'bg-red-500' : 'bg-gray-300'
                              }`}
                              style={{ width: `${(promedio / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 min-w-[30px]">
                            /5.0
                          </span>
                        </div>
                      </div>

                      {/* Aspectos a mejorar */}
                      {docente.aspectosAMejorar && docente.aspectosAMejorar.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200/50">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              Aspectos a Mejorar
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {docente.aspectosAMejorar.slice(0, 4).map((aspecto, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg"
                              >
                                <span className="text-xs font-medium text-orange-800">
                                  {aspecto.aspecto}
                                </span>
                                <span className={`text-xs font-bold ${
                                  parseFloat(aspecto.promedio) >= 3.0 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {aspecto.promedio}
                                </span>
                              </div>
                            ))}
                            {docente.aspectosAMejorar.length > 4 && (
                              <span className="text-xs text-gray-400 self-center">
                                +{docente.aspectosAMejorar.length - 4} más
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Mostrar mensaje si no hay aspectos a mejorar */}
                      {docente.aspectosAMejorar && docente.aspectosAMejorar.length === 0 && docente.aspectos && docente.aspectos.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200/50">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-green-600 font-medium">
                              Todos los aspectos están por encima del promedio esperado
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <GraduationCap className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-base font-medium">
                  No hay docentes para mostrar
                </p>
                <p className="text-sm mt-1">
                  No se encontraron docentes evaluados en este programa
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Footer con resumen */}
          {!dialogData.loading && dialogData.docentes && dialogData.docentes.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Total: {dialogData.docentes.length} docente
                {dialogData.docentes.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <Star className="h-3 w-3 mr-1" />
                  {dialogData.docentes.filter(d => d.estado === 'excelente').length} Excelente
                </Badge>
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {dialogData.docentes.filter(d => d.estado === 'bueno').length} Bueno
                </Badge>
                <Badge variant="outline" className="text-red-600 border-red-200">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {dialogData.docentes.filter(d => d.estado === 'necesita_mejora').length} A mejorar
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
