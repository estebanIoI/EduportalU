"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Search, ChevronDown, ChevronRight, MessageSquare, BookOpen, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFormContext } from "@/lib/form-context"
import { profesoresService } from "@/services"
import { Pagination } from "@/app/admin/components/pagination"
import { AsignaturaDocente, AspectoPuntaje, ProfesoresParams } from "@/lib/types/profesores"
import Filtros from "@/app/admin/components/filters"
import apiClient from "@/lib/api"

interface FiltrosState {
  configuracionSeleccionada: number | null
  periodoSeleccionado: string
  sedeSeleccionada: string
  programaSeleccionado: string
  semestreSeleccionado: string
  grupoSeleccionado: string
}

interface FiltersAspectosPuntaje {
  idDocente?: string;
  idConfiguracion?: number;
  periodo?: string;
  nombreSede?: string;
  nomPrograma?: string;
  semestre?: string;
  grupo?: string;
}

export default function ProfesoresPage() {
  const { toast } = useToast()
  
  const [filtros, setFiltros] = useState<FiltrosState>({
    configuracionSeleccionada: null,
    periodoSeleccionado: "",
    sedeSeleccionada: "",
    programaSeleccionado: "",
    semestreSeleccionado: "",
    grupoSeleccionado: ""
  })
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null)
  const [showEvaluations, setShowEvaluations] = useState<string | null>(null)
  const [selectedAspect, setSelectedAspect] = useState<{ teacherId: string; aspectId: string } | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<{ teacherId: string; courseId: string } | null>(null)
  const [docentes, setDocentes] = useState<AsignaturaDocente[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingInforme, setLoadingInforme] = useState(false)
  const [aspectosEvaluados, setAspectosEvaluados] = useState<Record<string, AspectoPuntaje[]>>({})
  const [loadingAspectos, setLoadingAspectos] = useState<Record<string, boolean>>({})
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null
  })

  const { activeAspectIds } = useFormContext()

  const convertirFiltrosAParams = useCallback((filtros: FiltrosState): ProfesoresParams => {
    const params: ProfesoresParams = {
      page: pagination.currentPage,
      limit: pagination.itemsPerPage
    }
    
    if (filtros.configuracionSeleccionada) {
      params.idConfiguracion = filtros.configuracionSeleccionada
    }
    if (filtros.periodoSeleccionado) {
      params.periodo = filtros.periodoSeleccionado
    }
    if (filtros.sedeSeleccionada) {
      params.nombreSede = filtros.sedeSeleccionada
    }
    if (filtros.programaSeleccionado) {
      params.nomPrograma = filtros.programaSeleccionado
    }
    if (filtros.semestreSeleccionado) {
      params.semestre = filtros.semestreSeleccionado
    }
    if (filtros.grupoSeleccionado) {
      params.grupo = filtros.grupoSeleccionado
    }
    
    return params
  }, [pagination.currentPage, pagination.itemsPerPage])

  const cargarDatos = useCallback(async (filtrosActuales: FiltrosState) => {
    setLoading(true)
    try {
      const params = convertirFiltrosAParams(filtrosActuales)
      const response = await profesoresService.getAsignaturas(params)
      
      setDocentes(response.data)
      
      // Update pagination from response
      setPagination({
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        totalItems: response.pagination.totalItems,
        itemsPerPage: response.pagination.itemsPerPage,
        hasNextPage: response.pagination.hasNextPage,
        hasPrevPage: response.pagination.hasPrevPage,
        nextPage: response.pagination.nextPage,
        prevPage: response.pagination.prevPage
      })
      
      setSelectedTeacher(null)
      setShowEvaluations(null)
      setSelectedAspect(null)
      setSelectedCourse(null)
      setAspectosEvaluados({})
      
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de los profesores",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [convertirFiltrosAParams, toast])

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
  }, [])

  useEffect(() => {
    cargarDatos(filtros)
  }, [filtros, pagination.currentPage, cargarDatos])

  const handleFiltrosChange = useCallback((nuevosFiltros: FiltrosState) => {
    setPagination(prev => ({ ...prev, currentPage: 1 }))
    setFiltros(nuevosFiltros)
  }, [])

  const limpiarFiltros = useCallback(() => {
    const filtrosLimpiados = {
      configuracionSeleccionada: filtros.configuracionSeleccionada,
      periodoSeleccionado: "",
      sedeSeleccionada: "",
      programaSeleccionado: "",
      semestreSeleccionado: "",
      grupoSeleccionado: ""
    }
    setFiltros(filtrosLimpiados)
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }, [filtros.configuracionSeleccionada])

  const asignaturasPorSemestre = useCallback((docente: AsignaturaDocente) => {
    const agrupadas: Record<string, typeof docente.asignaturas> = {}
    
    docente.asignaturas.forEach(asig => {
      if (!agrupadas[asig.SEMESTRE_PREDOMINANTE]) {
        agrupadas[asig.SEMESTRE_PREDOMINANTE] = []
      }
      agrupadas[asig.SEMESTRE_PREDOMINANTE].push(asig)
    })

    return agrupadas
  }, [])

  const filteredTeachers = useMemo(() => {
    let result = docentes

    if (searchTerm) {
      result = result.filter(
        (teacher) => {
          const matchesName = teacher.DOCENTE.toLowerCase().includes(searchTerm.toLowerCase())
          const matchesProgram = teacher.asignaturas.some(asig => 
            asig.PROGRAMA_PREDOMINANTE.toLowerCase().includes(searchTerm.toLowerCase())
          )
          return matchesName || matchesProgram
        }
      )
    }

    return result
  }, [docentes, searchTerm])

  const estadisticas = useMemo(() => {
    const programas = new Set<string>()
    let totalAsignaturas = 0
    let totalGrupos = 0

    docentes.forEach(docente => {
      docente.asignaturas.forEach(asig => {
        programas.add(asig.PROGRAMA_PREDOMINANTE)
        totalGrupos += asig.grupos.length
      })
      totalAsignaturas += docente.asignaturas.length
    })

    return {
      totalProfesores: docentes.length,
      totalProgramas: programas.size,
      totalAsignaturas,
      totalGrupos
    }
  }, [docentes])

// En la función cargarAspectosEvaluados
const cargarAspectosEvaluados = useCallback(async (idDocente: string) => {
  // Verificar si ya tenemos los datos para este docente
  if (aspectosEvaluados[idDocente]) return;

  setLoadingAspectos(prev => ({ ...prev, [idDocente]: true }));
  
  try {
    // Validar que tenemos los filtros necesarios
    if (!filtros.configuracionSeleccionada) {
      throw new Error("Se requiere seleccionar una configuración antes de cargar los aspectos evaluados");
    }

    // Preparar los parámetros para la consulta
    const params: FiltersAspectosPuntaje = {
      idDocente,
      idConfiguracion: filtros.configuracionSeleccionada,
      ...(filtros.periodoSeleccionado && { periodo: filtros.periodoSeleccionado }),
      ...(filtros.sedeSeleccionada && { nombreSede: filtros.sedeSeleccionada }),
      ...(filtros.programaSeleccionado && { nomPrograma: filtros.programaSeleccionado }),
      ...(filtros.semestreSeleccionado && { semestre: filtros.semestreSeleccionado }),
      ...(filtros.grupoSeleccionado && { grupo: filtros.grupoSeleccionado }),
    };

    console.log('Parámetros para cargar aspectos:', params);

    const response = await profesoresService.getAspectosPuntaje(params);

    setAspectosEvaluados(prev => ({ 
      ...prev, 
      [idDocente]: response.data 
    }));

  } catch (error) {
    console.error('Error al cargar aspectos:', error);
    
    let errorMessage = "No se pudieron cargar los aspectos evaluados";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setLoadingAspectos(prev => ({ ...prev, [idDocente]: false }));
  }
}, [aspectosEvaluados, toast, filtros]);

  const handleSelectTeacher = useCallback((id: string) => {
    setSelectedTeacher((prevId) => (prevId === id ? null : id))
    setShowEvaluations((prevId) => (prevId === id ? null : prevId))
    setSelectedAspect(null)
    setSelectedCourse(null)
  }, [])

  const toggleEvaluations = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setShowEvaluations((prevId) => {
      const newId = prevId === id ? null : id
      if (newId) {
        cargarAspectosEvaluados(newId)
      }
      return newId
    })
    setSelectedAspect(null)
  }, [cargarAspectosEvaluados])

  const toggleAspect = useCallback((teacherId: string, aspectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedAspect((prev) =>
      prev?.teacherId === teacherId && prev?.aspectId === aspectId ? null : { teacherId, aspectId },
    )
  }, [])

  const toggleCourse = useCallback((teacherId: string, courseKey: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedCourse((prev) =>
      prev?.teacherId === teacherId && prev?.courseId === courseKey ? null : { teacherId, courseId: courseKey },
    )
  }, [])

  const getScoreColor = useCallback((score: number) => {
    if (score >= 90) return "bg-green-500"
    if (score >= 80) return "bg-blue-500"
    if (score >= 70) return "bg-yellow-500"
    return "bg-red-500"
  }, [])

  const getScoreTextColor = useCallback((score: number) => {
    if (score >= 90) return "text-green-700"
    if (score >= 80) return "text-blue-700"
    if (score >= 70) return "text-yellow-700"
    return "text-red-700"
  }, [])

  const hayFiltrosAplicados = useMemo(() => {
    return filtros.periodoSeleccionado || 
           filtros.sedeSeleccionada || 
           filtros.programaSeleccionado || 
           filtros.semestreSeleccionado || 
           filtros.grupoSeleccionado
  }, [filtros])

  const getTextoInforme = useCallback(() => {
    const partes = []
    
    if (filtros.configuracionSeleccionada) {
      partes.push(`Config. ${filtros.configuracionSeleccionada}`)
    }
    if (filtros.periodoSeleccionado) {
      partes.push(`${filtros.periodoSeleccionado}`)
    }
    if (filtros.sedeSeleccionada) {
      partes.push(filtros.sedeSeleccionada)
    }
    if (filtros.programaSeleccionado) {
      partes.push(filtros.programaSeleccionado)
    }
    if (filtros.semestreSeleccionado) {
      partes.push(`Sem. ${filtros.semestreSeleccionado}`)
    }
    
    return partes.length > 0 ? partes.join(' - ') : "Informe General"
  }, [filtros])

  const puedeDescargarInforme = useMemo(() => {
    return !!filtros.sedeSeleccionada && !loadingInforme
  }, [filtros.sedeSeleccionada, loadingInforme])

  const handleDescargarInforme = useCallback(async () => {
    if (!puedeDescargarInforme) {
      toast({
        title: "Seleccione una sede",
        description: "Por favor seleccione una sede para generar el informe",
        variant: "destructive",
      });
      return;
    }

    setLoadingInforme(true);
    const tipoInforme = getTextoInforme();

    try {
      toast({
        title: "Generando informe",
        description: `Preparando informe para ${tipoInforme}`,
        variant: "default",
      });

      const params = {
        idConfiguracion: filtros.configuracionSeleccionada?.toString(),
        periodo: filtros.periodoSeleccionado,
        nombreSede: filtros.sedeSeleccionada,
        nomPrograma: filtros.programaSeleccionado,
        semestre: filtros.semestreSeleccionado,
        grupo: filtros.grupoSeleccionado,
      };

      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== null)
      );

      const response = await apiClient.downloadFile('/informe-docentes', {
        params: filteredParams,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: response.headers['content-type'],
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;

      const nombreArchivo = `Informe_Docentes_${
        filtros.sedeSeleccionada?.replace(/\s+/g, '_') || 'reporte'
      }_${new Date().toISOString().split('T')[0]}.docx`;
      link.download = nombreArchivo;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Informe descargado",
        description: `El informe "${nombreArchivo}" se ha descargado correctamente`,
        variant: "default",
      });

    } catch (error) {
      console.error('Error al descargar informe:', error);
      let errorMessage = "Ocurrió un error al descargar el informe. Por favor, inténtelo de nuevo más tarde.";

      toast({
        title: "Error al descargar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingInforme(false);
    }
  }, [filtros, puedeDescargarInforme, toast, getTextoInforme]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <>
      <header className="bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold">Profesores</h1>
        <p className="text-sm text-gray-500">Gestión y evaluación de docentes</p>
      </header>

      <main className="p-6">
        {/* Sección de Filtros */}
        <div className="mb-6">
          <Filtros 
            filtros={filtros}
            onFiltrosChange={handleFiltrosChange}
            onLimpiarFiltros={limpiarFiltros}
            loading={loading}
          />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Lista de Profesores</CardTitle>
                <CardDescription>
                  Evaluaciones y desempeño de los docentes
                  {hayFiltrosAplicados && (
                    <span className="ml-2 text-blue-600">
                      (Filtros aplicados)
                    </span>
                  )}
                </CardDescription>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <Button 
                  variant="outline" 
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border-blue-200 shadow-sm transition-all duration-200 flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleDescargarInforme}
                  disabled={!puedeDescargarInforme}
                >
                  {loadingInforme ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
                      Generando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Descargar Informe
                    </>
                  )}
                </Button>
                {puedeDescargarInforme ? (
                  <span className="text-xs text-gray-500 text-right max-w-48">
                    {getTextoInforme()}
                  </span>
                ) : (
                  <span className="text-xs text-red-500 text-right">
                    {loadingInforme ? "Generando informe..." : "Seleccione una sede"}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Buscar profesor..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900">Total Profesores</h3>
                <p className="text-2xl font-bold text-blue-700">{estadisticas.totalProfesores}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-900">Programas</h3>
                <p className="text-2xl font-bold text-green-700">{estadisticas.totalProgramas}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-900">Asignaturas</h3>
                <p className="text-2xl font-bold text-purple-700">{estadisticas.totalAsignaturas}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-orange-900">Grupos</h3>
                <p className="text-2xl font-bold text-orange-700">{estadisticas.totalGrupos}</p>
              </div>
            </div>

            <div className="space-y-4">
              {filteredTeachers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {docentes.length === 0 && hayFiltrosAplicados ? 
                    "No se encontraron profesores con los filtros aplicados." :
                    "No se encontraron profesores con los criterios de búsqueda."
                  }
                </div>
              ) : (
                filteredTeachers.map((teacher) => {
                  const isSelected = selectedTeacher === teacher.ID_DOCENTE
                  const showEvals = showEvaluations === teacher.ID_DOCENTE
                  const asignaturasAgrupadas = asignaturasPorSemestre(teacher)
                  const programaPrincipal = teacher.asignaturas[0]?.PROGRAMA_PREDOMINANTE || ""

                  return (
                    <div
                      key={teacher.ID_DOCENTE}
                      className={`border rounded-lg overflow-hidden transition-colors ${
                        isSelected ? "border-blue-500" : "hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`p-4 cursor-pointer ${
                          isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleSelectTeacher(teacher.ID_DOCENTE)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            {isSelected ? (
                              <ChevronDown className="h-5 w-5 mr-2" />
                            ) : (
                              <ChevronRight className="h-5 w-5 mr-2" />
                            )}
                            <div>
                              <h3 className="font-medium">{teacher.DOCENTE}</h3>
                              <p className="text-sm text-gray-500">{programaPrincipal}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className={`text-lg font-semibold ${getScoreTextColor(teacher.porcentaje_completado)}`}>
                                {teacher.porcentaje_completado}%
                              </div>
                              <div className="text-xs text-gray-500">
                                {teacher.evaluaciones_completadas}/{teacher.total_evaluaciones_esperadas} evaluaciones
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              teacher.estado_evaluacion === 'COMPLETADO' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {teacher.estado_evaluacion}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Progress
                            value={teacher.porcentaje_completado}
                            className="h-2"
                            indicatorClassName={getScoreColor(teacher.porcentaje_completado)}
                          />
                        </div>
                      </div>

                      {isSelected && (
                        <div className="bg-gray-50 border-t p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Total Evaluaciones Esperadas</p>
                              <p className="font-medium">{teacher.total_evaluaciones_esperadas}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Evaluaciones Completadas</p>
                              <p className="font-medium">{teacher.evaluaciones_completadas}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Evaluaciones Pendientes</p>
                              <p className="font-medium">{teacher.evaluaciones_pendientes}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Asignaturas ({teacher.asignaturas.length})</h4>
                            <div className="space-y-4">
                              {Object.entries(asignaturasAgrupadas).map(([semestre, asignaturas]) => (
                                <div key={semestre} className="border rounded-lg overflow-hidden">
                                  <div className="p-3 bg-gray-100">
                                    <h5 className="font-medium">{semestre}</h5>
                                  </div>
                                  <div className="divide-y">
                                    {asignaturas.map((asig) => {
                                      const courseKey = `${asig.COD_ASIGNATURA}-${asig.ASIGNATURA}`
                                      const isSelected = selectedCourse?.teacherId === teacher.ID_DOCENTE && 
                                                       selectedCourse?.courseId === courseKey

                                      return (
                                        <div
                                          key={courseKey}
                                          className={`p-3 cursor-pointer hover:bg-gray-50 ${
                                            isSelected ? "bg-blue-50" : ""
                                          }`}
                                          onClick={(e) => toggleCourse(teacher.ID_DOCENTE, courseKey, e)}
                                        >
                                          <div className="flex justify-between items-center">
                                            <div className="flex items-center">
                                              <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                                              <div>
                                                <span className="font-medium">{asig.ASIGNATURA}</span>
                                                <div className="text-sm text-gray-500">
                                                  {asig.PROGRAMA_PREDOMINANTE} - {asig.NOMBRE_SEDE}
                                                </div>
                                              </div>
                                            </div>
                                            <div className={`text-sm font-medium ${getScoreTextColor(asig.porcentaje_completado)}`}>
                                              {asig.porcentaje_completado}%
                                            </div>
                                          </div>
                                          <div className="mt-2">
                                            <Progress
                                              value={asig.porcentaje_completado}
                                              className="h-1.5"
                                              indicatorClassName={getScoreColor(asig.porcentaje_completado)}
                                            />
                                          </div>
                                          
                                          {/* Grupos de la asignatura */}
                                          {isSelected && (
                                            <div className="mt-4">
                                              <h6 className="text-sm font-medium mb-2">Grupos ({asig.grupos.length})</h6>
                                              <div className="space-y-2">
                                                {asig.grupos.map(grupo => (
                                                  <div key={`${asig.COD_ASIGNATURA}-${grupo.GRUPO}`} className="p-2 bg-white rounded border text-sm">
                                                    <div className="grid grid-cols-3 gap-2">
                                                      <div>
                                                        <p className="text-gray-500">Grupo:</p>
                                                        <p className="font-medium">{grupo.GRUPO}</p>
                                                      </div>
                                                      <div>
                                                        <p className="text-gray-500">Evaluaciones:</p>
                                                        <p className="font-medium">{grupo.evaluaciones_completadas}/{grupo.total_evaluaciones_esperadas}</p>
                                                      </div>
                                                      <div>
                                                        <p className="text-gray-500">Progreso:</p>
                                                        <div className="flex items-center gap-2">
                                                          <Progress
                                                            value={grupo.porcentaje_completado}
                                                            className="h-2 w-full"
                                                            indicatorClassName={getScoreColor(grupo.porcentaje_completado)}
                                                          />
                                                          <span className={`text-xs font-medium ${getScoreTextColor(grupo.porcentaje_completado)}`}>
                                                            {grupo.porcentaje_completado}%
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                onClick={(e) => toggleEvaluations(teacher.ID_DOCENTE, e)}
                                variant={showEvals ? "default" : "outline"}
                              >
                                {showEvals ? "Ocultar Evaluaciones" : "Ver Evaluaciones"}
                              </Button>
                            </div>
                          </div>

                          {showEvals && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="font-medium">Aspectos Evaluados</h4>
                                <div className="text-sm text-gray-500">
                                  Total de estudiantes: {teacher.total_evaluaciones_esperadas}
                                </div>
                              </div>
                              <div className="space-y-4">
                                {loadingAspectos[teacher.ID_DOCENTE] ? (
                                  <div className="text-center py-4 text-gray-500">
                                    Cargando aspectos evaluados...
                                  </div>
                                ) : aspectosEvaluados[teacher.ID_DOCENTE]?.length > 0 ? (
                                  aspectosEvaluados[teacher.ID_DOCENTE].map((aspecto) => {
                                    const puntaje = parseFloat(aspecto.PUNTAJE_PROMEDIO) * 100
                                    const isSelected = selectedAspect?.teacherId === teacher.ID_DOCENTE && 
                                                     selectedAspect?.aspectId === aspecto.ASPECTO

                                    return (
                                      <div key={aspecto.ASPECTO}>
                                        <div
                                          className={`cursor-pointer p-2 rounded-lg ${
                                            isSelected
                                              ? "bg-blue-50 border border-blue-200"
                                              : "hover:bg-gray-100"
                                          }`}
                                          onClick={(e) => toggleAspect(teacher.ID_DOCENTE, aspecto.ASPECTO, e)}
                                        >
                                          <div className="flex justify-between items-center">
                                            <div className="flex items-center">
                                              {isSelected ? (
                                                <ChevronDown className="h-4 w-4 mr-2" />
                                              ) : (
                                                <ChevronRight className="h-4 w-4 mr-2" />
                                              )}
                                              <span>{aspecto.ASPECTO}</span>
                                            </div>
                                            <span className={`text-sm font-medium ${getScoreTextColor(puntaje)}`}>
                                              {puntaje.toFixed(1)}%
                                            </span>
                                          </div>
                                          <div className="mt-1 pl-6">
                                            <Progress
                                              value={puntaje}
                                              className="h-2"
                                              indicatorClassName={getScoreColor(puntaje)}
                                            />
                                          </div>
                                        </div>

                                        {isSelected && (
                                          <div className="mt-2 ml-6 p-3 bg-white rounded-lg border">
                                            <div className="flex items-center mb-2">
                                              <MessageSquare className="h-4 w-4 mr-2 text-gray-500" />
                                              <h6 className="text-sm font-medium">Descripción</h6>
                                            </div>
                                            <p className="text-sm pl-2 border-l-2 border-gray-300">
                                              {aspecto.descripcion}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })
                                ) : (
                                  <div className="text-center py-4 text-gray-500">
                                    No hay aspectos evaluados disponibles.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Pagination */}
            <div className="mt-6">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                hasNextPage={pagination.hasNextPage}
                hasPrevPage={pagination.hasPrevPage}
                nextPage={pagination.nextPage}
                prevPage={pagination.prevPage}
                onPageChange={handlePageChange}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}