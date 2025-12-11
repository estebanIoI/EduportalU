"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import {
  Building2,
  GraduationCap,
  Building,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  Brain,
  BarChart3,
  RefreshCw,
  Download,
  Loader2,
  ChevronRight,
  BookOpen,
  Layers,
  Calendar,
  ClipboardList,
  AlertCircle,
  MessageSquare,
  Settings,
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import { reportesService } from "@/services/reportes/reportes.service"
import { configuracionEvaluacionService } from "@/services/evaluacionITP/configuracion/configuracionEvaluacion.service"
import {
  Facultad,
  Programa,
  Docente,
  ReportePrograma,
  ReporteFacultad,
  ReporteInstitucional,
  NivelReporte,
} from "@/lib/types/reportes.types"
import { ConfiguracionEvaluacion } from "@/lib/types/evaluacionInsitu"

import { 
  EstadisticasCards,
  GraficaAspectos,
  TablaDocentes,
  RankingDocentes,
  ResumenIAPanel,
  DetalleDocenteModal,
  GraficaComparativa,
  PanelAspectosEvaluados,
  PanelAnalisisComentarios,
} from "./components"

export default function ReportesPage() {
  // Estados de selección
  const [nivelReporte, setNivelReporte] = useState<NivelReporte>("institucional")
  const [facultadSeleccionada, setFacultadSeleccionada] = useState<string>("")
  const [programaSeleccionado, setProgramaSeleccionado] = useState<string>("")
  const [idConfiguracion, setIdConfiguracion] = useState<number | null>(null)
  const [incluirIA, setIncluirIA] = useState<boolean>(false)

  // Estados de configuraciones de evaluación
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionEvaluacion[]>([])
  const [loadingConfiguraciones, setLoadingConfiguraciones] = useState(true)

  // Estados de datos
  const [facultades, setFacultades] = useState<Facultad[]>([])
  const [programas, setProgramas] = useState<Programa[]>([])
  const [reportePrograma, setReportePrograma] = useState<ReportePrograma | null>(null)
  const [reporteFacultad, setReporteFacultad] = useState<ReporteFacultad | null>(null)
  const [reporteInstitucional, setReporteInstitucional] = useState<ReporteInstitucional | null>(null)

  // Estados para análisis de comentarios
  const [comentariosProgramaData, setComentariosProgramaData] = useState<{
    comentarios: Array<{ texto: string }>;
    resumen_ia: any | null;
  } | null>(null)
  const [loadingComentarios, setLoadingComentarios] = useState(false)

  // Estados de UI
  const [loading, setLoading] = useState(false)
  const [loadingFacultades, setLoadingFacultades] = useState(true)
  const [iaDisponible, setIaDisponible] = useState(false)
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<Docente | null>(null)
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false)

  // Cargar facultades, programas y configuraciones al inicio
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        setLoadingFacultades(true)
        setLoadingConfiguraciones(true)
        console.log("🔄 Iniciando carga de datos iniciales...")

        // Cargar configuraciones de evaluación
        console.log("📡 Solicitando configuraciones de evaluación...")
        try {
          const responseConfiguraciones = await configuracionEvaluacionService.getAll()
          if (responseConfiguraciones.success && responseConfiguraciones.data) {
            // Filtrar solo configuraciones activas de evaluación docente
            const configActivas = responseConfiguraciones.data.filter(
              (c) => c.ACTIVO && c.ES_EVALUACION_DOCENTE
            )
            setConfiguraciones(configActivas)
            
            // Seleccionar la primera configuración activa por defecto
            if (configActivas.length > 0) {
              setIdConfiguracion(configActivas[0].ID)
            }
            console.log(`✅ ${configActivas.length} configuraciones de evaluación cargadas`)
          }
        } catch (configError) {
          console.warn("⚠️ Error cargando configuraciones:", configError)
        } finally {
          setLoadingConfiguraciones(false)
        }

        // Cargar facultades
        console.log("📡 Solicitando facultades...")
        const responseFacultades = await reportesService.getFacultades()
        console.log("📥 Respuesta facultades:", responseFacultades)
        
        if (responseFacultades.success && responseFacultades.data) {
          setFacultades(responseFacultades.data)
          console.log(`✅ ${responseFacultades.data.length} facultades cargadas`)
        } else {
          console.warn("⚠️ No se obtuvieron facultades:", responseFacultades)
        }

        // Cargar todos los programas
        console.log("📡 Solicitando programas...")
        const responseProgramas = await reportesService.getProgramas()
        console.log("📥 Respuesta programas:", responseProgramas)
        
        if (responseProgramas.success && responseProgramas.data) {
          setProgramas(responseProgramas.data)
          console.log(`✅ ${responseProgramas.data.length} programas cargados`)
        } else {
          console.warn("⚠️ No se obtuvieron programas:", responseProgramas)
        }

        // Verificar disponibilidad de IA
        try {
          const responseIA = await reportesService.getIAStatus()
          if (responseIA.success && responseIA.data) {
            setIaDisponible(responseIA.data.available)
          }
        } catch (iaError) {
          console.log("ℹ️ IA no disponible:", iaError)
          setIaDisponible(false)
        }
      } catch (error: any) {
        console.error("❌ Error cargando datos iniciales:", error)
        
        // Mensaje más específico según el tipo de error
        let errorMessage = "No se pudieron cargar los datos iniciales"
        if (error.code === "ERR_NETWORK") {
          errorMessage = "No se puede conectar al servidor. Verifique que el backend esté ejecutándose."
        } else if (error.response?.status === 404) {
          errorMessage = "Endpoint no encontrado. Verifique la configuración del API."
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        }
        
        toast({
          title: "Error de conexión",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoadingFacultades(false)
      }
    }

    cargarDatosIniciales()
  }, [])

  // Filtrar programas cuando se selecciona una facultad
  const programasFiltrados = facultadSeleccionada
    ? programas.filter((p) => p.facultad_id === parseInt(facultadSeleccionada))
    : programas

  // Agrupar programas por facultad para la vista de clasificación
  const facultadesConProgramas = facultades.map((facultad) => ({
    ...facultad,
    programas: programas.filter((p) => p.facultad_id === facultad.ID),
  }))

  // Cargar reporte según nivel seleccionado
  const cargarReporte = useCallback(async () => {
    if (!idConfiguracion) {
      toast({
        title: "Advertencia",
        description: "Seleccione una configuración de evaluación",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const filtros = { idConfiguracion: idConfiguracion!, incluirIA }

      switch (nivelReporte) {
        case "programa":
          if (!programaSeleccionado) {
            toast({ title: "Advertencia", description: "Seleccione un programa", variant: "destructive" })
            setLoading(false)
            return
          }
          const respPrograma = await reportesService.getReportePrograma(
            parseInt(programaSeleccionado),
            filtros
          )
          if (respPrograma.success) {
            setReportePrograma(respPrograma.data)
            setReporteFacultad(null)
            setReporteInstitucional(null)
          }
          break

        case "facultad":
          if (!facultadSeleccionada) {
            toast({ title: "Advertencia", description: "Seleccione una facultad", variant: "destructive" })
            setLoading(false)
            return
          }
          const respFacultad = await reportesService.getReporteFacultad(
            parseInt(facultadSeleccionada),
            filtros
          )
          if (respFacultad.success) {
            setReporteFacultad(respFacultad.data)
            setReportePrograma(null)
            setReporteInstitucional(null)
          }
          break

        case "institucional":
          const respInstitucional = await reportesService.getReporteInstitucional(filtros)
          if (respInstitucional.success) {
            setReporteInstitucional(respInstitucional.data)
            setReportePrograma(null)
            setReporteFacultad(null)
          }
          break
      }

      toast({
        title: "Éxito",
        description: "Reporte cargado correctamente",
      })
    } catch (error) {
      console.error("Error cargando reporte:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el reporte",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [nivelReporte, facultadSeleccionada, programaSeleccionado, idConfiguracion, incluirIA])

  // Cargar y analizar comentarios del programa
  const cargarComentariosPrograma = useCallback(async (analizarConIA: boolean = false) => {
    if (!programaSeleccionado || !idConfiguracion) {
      toast({
        title: "Advertencia",
        description: "Seleccione un programa y una configuración de evaluación",
        variant: "destructive",
      })
      return
    }

    setLoadingComentarios(true)
    try {
      const response = await reportesService.getComentariosPrograma(
        parseInt(programaSeleccionado),
        idConfiguracion,
        analizarConIA
      )

      if (response.success && response.data) {
        setComentariosProgramaData({
          comentarios: response.data.comentarios || [],
          resumen_ia: response.data.resumen_ia
        })

        if (analizarConIA && response.data.resumen_ia) {
          toast({
            title: "Análisis completado",
            description: "Los comentarios han sido analizados con IA",
          })
        }
      }
    } catch (error) {
      console.error("Error cargando comentarios:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los comentarios",
        variant: "destructive",
      })
    } finally {
      setLoadingComentarios(false)
    }
  }, [programaSeleccionado, idConfiguracion])

  // Analizar comentarios con IA (endpoint directo)
  const analizarComentariosConIA = useCallback(async () => {
    if (!comentariosProgramaData?.comentarios.length) {
      toast({
        title: "Advertencia",
        description: "No hay comentarios para analizar",
        variant: "destructive",
      })
      return
    }

    setLoadingComentarios(true)
    try {
      const textos = comentariosProgramaData.comentarios.map(c => c.texto)
      const response = await reportesService.generarResumenIA({
        comentarios: textos,
        tipo: 'fortalezas_mejora'
      })

      if (response.success && response.data) {
        setComentariosProgramaData(prev => prev ? {
          ...prev,
          resumen_ia: {
            ...response.data,
            procesado_con_ia: true
          }
        } : null)

        toast({
          title: "Análisis completado",
          description: "Los comentarios han sido analizados con IA (Ollama)",
        })
      }
    } catch (error) {
      console.error("Error analizando comentarios:", error)
      toast({
        title: "Error",
        description: "No se pudo completar el análisis con IA",
        variant: "destructive",
      })
    } finally {
      setLoadingComentarios(false)
    }
  }, [comentariosProgramaData])

  // Manejar click en docente
  const handleVerDetalleDocente = (docente: Docente) => {
    setDocenteSeleccionado(docente)
    setModalDetalleAbierto(true)
  }

  // Obtener estadísticas según el nivel actual
  const getEstadisticas = () => {
    switch (nivelReporte) {
      case "programa":
        return reportePrograma?.estadisticas
      case "facultad":
        return reporteFacultad?.estadisticas
      case "institucional":
        return reporteInstitucional?.estadisticas
      default:
        return null
    }
  }

  // Obtener rankings según el nivel actual
  const getRankings = () => {
    switch (nivelReporte) {
      case "programa":
        return {
          positivos: reportePrograma?.ranking_positivos || [],
          mejora: reportePrograma?.ranking_mejora || [],
        }
      case "facultad":
        return {
          positivos: reporteFacultad?.ranking_positivos || [],
          mejora: reporteFacultad?.ranking_mejora || [],
        }
      case "institucional":
        return {
          positivos: reporteInstitucional?.ranking_global_positivos || [],
          mejora: reporteInstitucional?.ranking_global_mejora || [],
        }
      default:
        return { positivos: [], mejora: [] }
    }
  }

  // Obtener la configuración seleccionada
  const configuracionActual = configuraciones.find(c => c.ID === idConfiguracion)

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reportes de Evaluación</h1>
          <p className="text-muted-foreground">
            Análisis consolidado de evaluaciones docentes
          </p>
          {configuracionActual && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {configuracionActual.TITULO || configuracionActual.TIPO_EVALUACION_NOMBRE}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(configuracionActual.FECHA_INICIO).toLocaleDateString("es-CO")} - {new Date(configuracionActual.FECHA_FIN).toLocaleDateString("es-CO")}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {iaDisponible && (
            <div className="flex items-center space-x-2">
              <Switch
                id="incluir-ia"
                checked={incluirIA}
                onCheckedChange={setIncluirIA}
              />
              <Label htmlFor="incluir-ia" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Análisis IA
              </Label>
            </div>
          )}
          <Button variant="outline" disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Selectores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel de Filtros */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Filtros del Reporte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selector de configuración de evaluación */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                Período de Evaluación
              </Label>
              {loadingConfiguraciones ? (
                <Skeleton className="h-10 w-full" />
              ) : configuraciones.length === 0 ? (
                <div className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>No hay configuraciones de evaluación disponibles</span>
                </div>
              ) : (
                <Select
                  value={idConfiguracion?.toString() || ""}
                  onValueChange={(v) => setIdConfiguracion(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione período de evaluación" />
                  </SelectTrigger>
                  <SelectContent>
                    {configuraciones.map((config) => (
                      <SelectItem key={config.ID} value={config.ID.toString()}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-medium">{config.TITULO || config.TIPO_EVALUACION_NOMBRE}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(config.FECHA_INICIO).toLocaleDateString("es-CO")} - {new Date(config.FECHA_FIN).toLocaleDateString("es-CO")}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Separator />

            {/* Selector de nivel */}
            <div className="space-y-2">
              <Label>Nivel del Informe</Label>
              <Select value={nivelReporte} onValueChange={(v) => setNivelReporte(v as NivelReporte)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="institucional">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Institucional
                    </div>
                  </SelectItem>
                  <SelectItem value="facultad">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Por Facultad
                    </div>
                  </SelectItem>
                  <SelectItem value="programa">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Por Programa
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selector de facultad (visible si nivel es facultad o programa) */}
            {(nivelReporte === "facultad" || nivelReporte === "programa") && (
              <div className="space-y-2">
                <Label>Facultad</Label>
                <Select
                  value={facultadSeleccionada}
                  onValueChange={(value) => {
                    setFacultadSeleccionada(value)
                    setProgramaSeleccionado("") // Limpiar programa al cambiar facultad
                  }}
                  disabled={loadingFacultades}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione facultad" />
                  </SelectTrigger>
                  <SelectContent>
                    {facultades.map((f) => (
                      <SelectItem key={f.ID} value={f.ID.toString()}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{f.NOMBRE}</span>
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {f.total_programas || programas.filter(p => p.facultad_id === f.ID).length} prog.
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Selector de programa (visible solo si nivel es programa) */}
            {nivelReporte === "programa" && (
              <div className="space-y-2">
                <Label>Programa / Carrera</Label>
                <Select
                  value={programaSeleccionado}
                  onValueChange={setProgramaSeleccionado}
                  disabled={loadingFacultades || !facultadSeleccionada}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={facultadSeleccionada ? "Seleccione programa" : "Primero seleccione una facultad"} />
                  </SelectTrigger>
                  <SelectContent>
                    {programasFiltrados.map((p) => (
                      <SelectItem key={p.ID} value={p.ID.toString()}>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{p.NOMBRE}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {p.NIVEL}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Botón de generar */}
            <Button onClick={cargarReporte} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generar Reporte
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Panel de Clasificación de Facultades y Programas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Estructura Académica
            </CardTitle>
            <CardDescription>
              Clasificación de facultades según sus programas y carreras
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingFacultades ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[280px] pr-4">
                <Accordion type="multiple" className="w-full">
                  {facultadesConProgramas.map((facultad) => (
                    <AccordionItem key={facultad.ID} value={`facultad-${facultad.ID}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Building className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">{facultad.NOMBRE}</p>
                              <p className="text-xs text-muted-foreground">
                                {facultad.CODIGO}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="mr-2">
                            {facultad.programas.length} programa{facultad.programas.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-4 space-y-2 mt-2">
                          {facultad.programas.length > 0 ? (
                            facultad.programas.map((programa) => (
                              <div
                                key={programa.ID}
                                className={`flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer hover:bg-accent ${
                                  programaSeleccionado === programa.ID.toString()
                                    ? "bg-accent border-primary"
                                    : "bg-background"
                                }`}
                                onClick={() => {
                                  setNivelReporte("programa")
                                  setFacultadSeleccionada(facultad.ID.toString())
                                  setProgramaSeleccionado(programa.ID.toString())
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium">{programa.NOMBRE}</p>
                                    <p className="text-xs text-muted-foreground">{programa.CODIGO}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {programa.NIVEL}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {programa.MODALIDAD}
                                  </Badge>
                                  {programa.total_docentes !== undefined && programa.total_docentes > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      {programa.total_docentes} docentes
                                    </Badge>
                                  )}
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground py-2">
                              No hay programas registrados en esta facultad.
                            </p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                {facultadesConProgramas.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No hay facultades registradas</p>
                  </div>
                )}
              </ScrollArea>
            )}
            <Separator className="my-4" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Total Facultades: <strong className="text-foreground">{facultades.length}</strong></span>
              <span>Total Programas: <strong className="text-foreground">{programas.length}</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenido del reporte */}
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      ) : (
        <>
          {/* Estadísticas generales */}
          {getEstadisticas() && (
            <EstadisticasCards
              estadisticas={getEstadisticas()!}
              nivel={nivelReporte}
            />
          )}

          {/* Tabs de contenido */}
          {(reportePrograma || reporteFacultad || reporteInstitucional) && (
            <Tabs defaultValue="grafica" className="space-y-4">
              <TabsList>
                <TabsTrigger value="grafica">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Gráficas
                </TabsTrigger>
                <TabsTrigger value="aspectos">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Aspectos
                </TabsTrigger>
                <TabsTrigger value="comentarios">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comentarios
                </TabsTrigger>
                <TabsTrigger value="docentes">
                  <Users className="h-4 w-4 mr-2" />
                  Docentes
                </TabsTrigger>
                <TabsTrigger value="rankings">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Rankings
                </TabsTrigger>
                {incluirIA && (
                  <TabsTrigger value="ia">
                    <Brain className="h-4 w-4 mr-2" />
                    Análisis IA
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Tab Gráficas */}
              <TabsContent value="grafica" className="space-y-4">
                {nivelReporte === "programa" && reportePrograma && (
                  <GraficaAspectos
                    docentes={reportePrograma.docentes}
                    titulo={`Evaluación por Aspectos - ${reportePrograma.programa.NOMBRE}`}
                  />
                )}
                {nivelReporte === "facultad" && reporteFacultad && (
                  <GraficaComparativa
                    items={reporteFacultad.grafica_comparativa.labels.map((label, i) => ({
                      nombre: label,
                      promedio: typeof reporteFacultad.grafica_comparativa.values[i] === 'string' 
                        ? parseFloat(reporteFacultad.grafica_comparativa.values[i] as string) 
                        : (reporteFacultad.grafica_comparativa.values[i] as number),
                      totalDocentes: reporteFacultad.grafica_comparativa.total_docentes?.[i],
                    }))}
                    titulo={`Comparativa por Programas - ${reporteFacultad.facultad.nombre}`}
                    etiqueta="Promedio"
                  />
                )}
                {nivelReporte === "institucional" && reporteInstitucional && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <GraficaAspectos
                      docentes={[]}
                      datos={reporteInstitucional.grafica_aspectos}
                      titulo="Evaluación por Aspectos - Institucional"
                    />
                    <GraficaComparativa
                      items={reporteInstitucional.grafica_facultades.labels.map((label, i) => ({
                        nombre: label,
                        promedio: typeof reporteInstitucional.grafica_facultades.values[i] === 'string' 
                          ? parseFloat(reporteInstitucional.grafica_facultades.values[i] as string) 
                          : (reporteInstitucional.grafica_facultades.values[i] as number),
                        totalDocentes: reporteInstitucional.grafica_facultades.total_docentes?.[i],
                      }))}
                      titulo="Comparativa por Facultades"
                      etiqueta="Promedio"
                    />
                  </div>
                )}
              </TabsContent>

              {/* Tab Aspectos Evaluados */}
              <TabsContent value="aspectos" className="space-y-4">
                {nivelReporte === "programa" && reportePrograma && reportePrograma.docentes.length > 0 && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ClipboardList className="h-5 w-5" />
                          Aspectos Evaluados - {reportePrograma.programa.NOMBRE}
                        </CardTitle>
                        <CardDescription>
                          Consolidado de aspectos evaluados para todos los docentes del programa
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Seleccione un docente de la tabla a continuación para ver el detalle de sus aspectos evaluados.
                        </p>
                      </CardContent>
                    </Card>
                    
                    {/* Panel de aspectos consolidado del programa */}
                    <PanelAspectosEvaluados
                      docente={reportePrograma.docentes[0]}
                      titulo="Detalle de Aspectos - Primer Docente"
                      mostrarComentarios={true}
                    />
                  </div>
                )}
                {nivelReporte === "facultad" && reporteFacultad && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" />
                        Aspectos Evaluados por Programa
                      </CardTitle>
                      <CardDescription>
                        Seleccione un programa específico para ver el detalle de aspectos evaluados
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      <Building className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Para ver el detalle de aspectos, seleccione el nivel "Por Programa"</p>
                    </CardContent>
                  </Card>
                )}
                {nivelReporte === "institucional" && reporteInstitucional && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" />
                        Aspectos Evaluados a Nivel Institucional
                      </CardTitle>
                      <CardDescription>
                        Vista consolidada de aspectos evaluados en toda la institución
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {reporteInstitucional.grafica_aspectos && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {reporteInstitucional.grafica_aspectos.labels.map((label, idx) => {
                              const value = typeof reporteInstitucional.grafica_aspectos.values[idx] === 'string'
                                ? parseFloat(reporteInstitucional.grafica_aspectos.values[idx] as string)
                                : (reporteInstitucional.grafica_aspectos.values[idx] as number)
                              return (
                                <Card key={idx} className={`${value >= 4.0 ? 'border-green-200 dark:border-green-800' : value >= 3.5 ? 'border-yellow-200 dark:border-yellow-800' : 'border-red-200 dark:border-red-800'}`}>
                                  <CardContent className="p-4 text-center">
                                    <p className="text-xs text-muted-foreground mb-1 truncate" title={label}>{label}</p>
                                    <p className={`text-2xl font-bold ${value >= 4.0 ? 'text-green-600' : value >= 3.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                      {value.toFixed(2)}
                                    </p>
                                  </CardContent>
                                </Card>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tab Comentarios */}
              <TabsContent value="comentarios" className="space-y-4">
                {nivelReporte === "programa" && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <MessageSquare className="h-5 w-5" />
                              Análisis de Comentarios
                              {reportePrograma?.programa?.NOMBRE && ` - ${reportePrograma.programa.NOMBRE}`}
                            </CardTitle>
                            <CardDescription>
                              Análisis de comentarios de estudiantes usando IA local (Ollama)
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cargarComentariosPrograma(false)}
                              disabled={loadingComentarios || !programaSeleccionado || !idConfiguracion}
                            >
                              {loadingComentarios ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                              )}
                              Cargar Comentarios
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => cargarComentariosPrograma(true)}
                              disabled={loadingComentarios || !programaSeleccionado || !idConfiguracion || !iaDisponible}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              {loadingComentarios ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Brain className="h-4 w-4 mr-2" />
                              )}
                              Analizar con IA
                            </Button>
                          </div>
                        </div>
                        {!iaDisponible && (
                          <div className="flex items-center gap-2 mt-2 text-yellow-600 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>Ollama no está disponible. Ejecute los modelos: nomic-embed-text y phi3.1:mini</span>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent>
                        {!programaSeleccionado || !idConfiguracion ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Seleccione un programa y una configuración de evaluación para cargar comentarios</p>
                          </div>
                        ) : !comentariosProgramaData ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Haga clic en "Cargar Comentarios" para obtener los comentarios de la base de datos</p>
                            <p className="text-xs mt-2">O use "Analizar con IA" para cargar y analizar automáticamente</p>
                          </div>
                        ) : comentariosProgramaData.comentarios.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No hay comentarios disponibles para este programa</p>
                          </div>
                        ) : (
                          <PanelAnalisisComentarios
                            comentarios={comentariosProgramaData.comentarios.map(c => ({
                              texto: c.texto,
                              fecha: new Date().toISOString()
                            }))}
                            resumenIA={comentariosProgramaData.resumen_ia}
                            titulo={`${comentariosProgramaData.comentarios.length} comentarios encontrados`}
                          />
                        )}
                      </CardContent>
                    </Card>

                    {/* Panel adicional para docentes si hay datos del reporte */}
                    {reportePrograma && reportePrograma.docentes.length > 0 && (
                      <div className="space-y-4">
                        <Separator />
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Comentarios por Docente
                        </h3>
                        {reportePrograma.docentes.slice(0, 3).map((docente) => (
                          <PanelAnalisisComentarios
                            key={docente.documento}
                            docente={docente}
                            titulo={`${docente.nombre} (${docente.documento})`}
                            resumenIA={docente.materias[0]?.resumen_ia}
                          />
                        ))}
                        {reportePrograma.docentes.length > 3 && (
                          <p className="text-sm text-muted-foreground text-center">
                            Y {reportePrograma.docentes.length - 3} docentes más...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {(nivelReporte === "facultad" || nivelReporte === "institucional") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Análisis de Comentarios
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Para ver el análisis detallado de comentarios, seleccione el nivel "Por Programa"</p>
                      <p className="text-xs mt-2">Los comentarios se analizan a nivel de programa y docente individual</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tab Docentes */}
              <TabsContent value="docentes">
                {nivelReporte === "programa" && reportePrograma && (
                  <TablaDocentes
                    docentes={reportePrograma.docentes}
                    onVerDetalle={handleVerDetalleDocente}
                  />
                )}
                {nivelReporte === "facultad" && reporteFacultad && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Programas de {reporteFacultad.facultad.nombre}
                      </CardTitle>
                      <CardDescription>
                        Clasificación de programas con sus estadísticas de evaluación
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="multiple" className="w-full">
                        {reporteFacultad.programas.map((programa) => (
                          <AccordionItem key={programa.id} value={`prog-${programa.id}`}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-blue-500/10">
                                    <GraduationCap className="h-4 w-4 text-blue-500" />
                                  </div>
                                  <div className="text-left">
                                    <p className="font-medium">{programa.nombre}</p>
                                    <p className="text-xs text-muted-foreground">{programa.codigo}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">
                                    {programa.estadisticas.total_docentes} docentes
                                  </Badge>
                                  <Badge variant="outline">
                                    {programa.estadisticas.total_evaluaciones} evaluaciones
                                  </Badge>
                                  <Badge 
                                    variant={programa.estadisticas.promedio_general >= 4 ? "default" : "secondary"}
                                    className={programa.estadisticas.promedio_general >= 4 ? "bg-green-500" : ""}
                                  >
                                    Promedio: {programa.estadisticas.promedio_general.toFixed(2)}
                                  </Badge>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg mt-2">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-blue-500">{programa.estadisticas.total_docentes}</p>
                                  <p className="text-xs text-muted-foreground">Docentes</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-green-500">{programa.estadisticas.total_estudiantes_evaluaron}</p>
                                  <p className="text-xs text-muted-foreground">Estudiantes</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-purple-500">{programa.estadisticas.total_evaluaciones}</p>
                                  <p className="text-xs text-muted-foreground">Evaluaciones</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-orange-500">{programa.estadisticas.promedio_general.toFixed(2)}</p>
                                  <p className="text-xs text-muted-foreground">Promedio</p>
                                </div>
                              </div>
                              {programa.ranking_positivos && programa.ranking_positivos.length > 0 && (
                                <div className="mt-4 p-4 border rounded-lg">
                                  <h4 className="font-medium flex items-center gap-2 mb-3">
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                    Top Docentes del Programa
                                  </h4>
                                  <div className="space-y-2">
                                    {programa.ranking_positivos.map((doc: any, idx: number) => (
                                      <div key={idx} className="flex items-center justify-between p-2 bg-background rounded">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline">{idx + 1}°</Badge>
                                          <span className="text-sm">{doc.nombre || doc.documento}</span>
                                        </div>
                                        <Badge variant="secondary">{doc.promedio?.toFixed(2) || doc.total_positivos}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                )}
                {nivelReporte === "institucional" && reporteInstitucional && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Facultades de la Institución
                      </CardTitle>
                      <CardDescription>
                        Vista consolidada de todas las facultades con sus programas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="multiple" className="w-full">
                        {reporteInstitucional.facultades.map((facultad) => (
                          <AccordionItem key={facultad.id} value={`fac-${facultad.id}`}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-primary/10">
                                    <Building className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="text-left">
                                    <p className="font-medium">{facultad.nombre}</p>
                                    <p className="text-xs text-muted-foreground">{facultad.codigo}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {facultad.estadisticas.total_programas} programas
                                  </Badge>
                                  <Badge variant="secondary">
                                    {facultad.estadisticas.total_docentes} docentes
                                  </Badge>
                                  <Badge 
                                    variant={facultad.estadisticas.promedio_general >= 4 ? "default" : "secondary"}
                                    className={facultad.estadisticas.promedio_general >= 4 ? "bg-green-500" : ""}
                                  >
                                    Promedio: {facultad.estadisticas.promedio_general.toFixed(2)}
                                  </Badge>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 mt-2">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-primary">{facultad.estadisticas.total_programas}</p>
                                    <p className="text-xs text-muted-foreground">Programas</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-500">{facultad.estadisticas.total_docentes}</p>
                                    <p className="text-xs text-muted-foreground">Docentes</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-green-500">{facultad.estadisticas.total_estudiantes_evaluaron}</p>
                                    <p className="text-xs text-muted-foreground">Estudiantes</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-500">{facultad.estadisticas.total_evaluaciones}</p>
                                    <p className="text-xs text-muted-foreground">Evaluaciones</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-orange-500">{facultad.estadisticas.promedio_general.toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">Promedio</p>
                                  </div>
                                </div>
                                {facultad.ranking_positivos && facultad.ranking_positivos.length > 0 && (
                                  <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium flex items-center gap-2 mb-3">
                                      <TrendingUp className="h-4 w-4 text-green-500" />
                                      Top Docentes de la Facultad
                                    </h4>
                                    <div className="space-y-2">
                                      {facultad.ranking_positivos.map((doc: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-background rounded">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline">{idx + 1}°</Badge>
                                            <span className="text-sm">{doc.nombre || doc.documento}</span>
                                            {doc.programa && (
                                              <span className="text-xs text-muted-foreground">({doc.programa})</span>
                                            )}
                                          </div>
                                          <Badge variant="secondary">{doc.promedio?.toFixed(2) || doc.total_positivos}</Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tab Rankings */}
              <TabsContent value="rankings" className="space-y-4">
                {nivelReporte === "programa" && reportePrograma && (
                  <RankingDocentes
                    docentes={reportePrograma.docentes}
                    topPositivos={5}
                    topMejora={5}
                  />
                )}
                {nivelReporte === "facultad" && reporteFacultad && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                          <TrendingUp className="h-5 w-5" />
                          Top Docentes Destacados
                        </CardTitle>
                        <CardDescription>
                          Docentes con mejores evaluaciones en {reporteFacultad.facultad.nombre}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {reporteFacultad.ranking_positivos.length > 0 ? (
                          <div className="space-y-3">
                            {reporteFacultad.ranking_positivos.map((doc: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    idx === 0 ? "bg-yellow-500 text-yellow-950" : 
                                    idx === 1 ? "bg-gray-300 text-gray-700" : 
                                    idx === 2 ? "bg-orange-400 text-orange-950" : "bg-muted"
                                  }`}>
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium">{doc.nombre || doc.documento}</p>
                                    {doc.programa && (
                                      <p className="text-xs text-muted-foreground">{doc.programa}</p>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="default" className="bg-green-500">
                                  {doc.promedio?.toFixed(2) || doc.total_positivos} pts
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-4">No hay datos de ranking</p>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-600">
                          <TrendingDown className="h-5 w-5" />
                          Docentes con Oportunidad de Mejora
                        </CardTitle>
                        <CardDescription>
                          Docentes que requieren atención en {reporteFacultad.facultad.nombre}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {reporteFacultad.ranking_mejora.length > 0 ? (
                          <div className="space-y-3">
                            {reporteFacultad.ranking_mejora.map((doc: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium">{doc.nombre || doc.documento}</p>
                                    {doc.programa && (
                                      <p className="text-xs text-muted-foreground">{doc.programa}</p>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="outline" className="border-orange-500 text-orange-600">
                                  {doc.promedio?.toFixed(2) || doc.total_mejora} pts
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-4">No hay datos de ranking</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
                {nivelReporte === "institucional" && reporteInstitucional && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                          <TrendingUp className="h-5 w-5" />
                          Ranking Institucional - Destacados
                        </CardTitle>
                        <CardDescription>
                          Mejores docentes evaluados a nivel institucional
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {reporteInstitucional.ranking_global_positivos.length > 0 ? (
                          <div className="space-y-3">
                            {reporteInstitucional.ranking_global_positivos.map((doc: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    idx === 0 ? "bg-yellow-500 text-yellow-950" : 
                                    idx === 1 ? "bg-gray-300 text-gray-700" : 
                                    idx === 2 ? "bg-orange-400 text-orange-950" : "bg-muted"
                                  }`}>
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium">{doc.nombre || doc.documento}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {doc.facultad_nombre && <span>{doc.facultad_nombre}</span>}
                                      {doc.programa && <span>• {doc.programa}</span>}
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="default" className="bg-green-500">
                                  {doc.promedio?.toFixed(2) || doc.total_positivos} pts
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-4">No hay datos de ranking</p>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-600">
                          <TrendingDown className="h-5 w-5" />
                          Ranking Institucional - Oportunidad de Mejora
                        </CardTitle>
                        <CardDescription>
                          Docentes que requieren atención a nivel institucional
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {reporteInstitucional.ranking_global_mejora.length > 0 ? (
                          <div className="space-y-3">
                            {reporteInstitucional.ranking_global_mejora.map((doc: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium">{doc.nombre || doc.documento}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {doc.facultad_nombre && <span>{doc.facultad_nombre}</span>}
                                      {doc.programa && <span>• {doc.programa}</span>}
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="outline" className="border-orange-500 text-orange-600">
                                  {doc.promedio?.toFixed(2) || doc.total_mejora} pts
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-4">No hay datos de ranking</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Tab IA */}
              {incluirIA && (
                <TabsContent value="ia">
                  {nivelReporte === "programa" && reportePrograma && reportePrograma.docentes.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Seleccione un docente para generar un análisis con IA de sus comentarios.
                      </p>
                      {reportePrograma.docentes.slice(0, 3).map((docente) => (
                        <ResumenIAPanel
                          key={docente.documento}
                          docente={docente}
                        />
                      ))}
                    </div>
                  )}
                  {nivelReporte !== "programa" && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Seleccione el nivel "Por Programa" para utilizar el análisis con IA.</p>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          )}

          {/* Mensaje cuando no hay datos */}
          {!reportePrograma && !reporteFacultad && !reporteInstitucional && (
            <Card className="py-16">
              <CardContent className="text-center">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Genere un reporte</h3>
                <p className="text-muted-foreground">
                  Seleccione el nivel del informe y los filtros, luego haga clic en "Generar Reporte"
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Modal de detalle de docente */}
      <DetalleDocenteModal
        docente={docenteSeleccionado}
        open={modalDetalleAbierto}
        onClose={() => setModalDetalleAbierto(false)}
      />
    </div>
  )
}
