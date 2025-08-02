"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  BookOpen,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFormContext } from "@/lib/form-context";
import { profesoresService } from "@/services";
import { Pagination } from "@/app/admin/components/pagination";
import {
  AsignaturaDocente,
  AspectoPuntaje,
  ProfesoresParams,
} from "@/lib/types/profesores";
import Filtros from "@/app/admin/components/filters";
import apiClient from "@/lib/api";

interface FiltrosState {
  configuracionSeleccionada: number | null;
  periodoSeleccionado: string;
  sedeSeleccionada: string;
  programaSeleccionado: string;
  semestreSeleccionado: string;
  grupoSeleccionado: string;
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
  const { toast } = useToast();

  const [filtros, setFiltros] = useState<FiltrosState>({
    configuracionSeleccionada: null,
    periodoSeleccionado: "",
    sedeSeleccionada: "",
    programaSeleccionado: "",
    semestreSeleccionado: "",
    grupoSeleccionado: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [showEvaluations, setShowEvaluations] = useState<string | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<{
    teacherId: string;
    aspectId: string;
  } | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<{
    teacherId: string;
    courseId: string;
  } | null>(null);
  const [docentes, setDocentes] = useState<AsignaturaDocente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInforme, setLoadingInforme] = useState(false);
  const [aspectosEvaluados, setAspectosEvaluados] = useState<
    Record<string, AspectoPuntaje[]>
  >({});
  const [loadingAspectos, setLoadingAspectos] = useState<
    Record<string, boolean>
  >({});

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
    nextPage: null,
    prevPage: null,
  });

  const { activeAspectIds } = useFormContext();

  const convertirFiltrosAParams = useCallback(
    (filtros: FiltrosState): ProfesoresParams => {
      const params: ProfesoresParams = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
      };

      if (filtros.configuracionSeleccionada) {
        params.idConfiguracion = filtros.configuracionSeleccionada;
      }
      if (filtros.periodoSeleccionado) {
        params.periodo = filtros.periodoSeleccionado;
      }
      if (filtros.sedeSeleccionada) {
        params.nombreSede = filtros.sedeSeleccionada;
      }
      if (filtros.programaSeleccionado) {
        params.nomPrograma = filtros.programaSeleccionado;
      }
      if (filtros.semestreSeleccionado) {
        params.semestre = filtros.semestreSeleccionado;
      }
      if (filtros.grupoSeleccionado) {
        params.grupo = filtros.grupoSeleccionado;
      }

      return params;
    },
    [pagination.currentPage, pagination.itemsPerPage]
  );

  const cargarDatos = useCallback(
    async (filtrosActuales: FiltrosState) => {
      setLoading(true);
      try {
        const params = convertirFiltrosAParams(filtrosActuales);
        const response = await profesoresService.getAsignaturas(params);

        setDocentes(response.data);

        // Update pagination from response
        setPagination({
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          totalItems: response.pagination.totalItems,
          itemsPerPage: response.pagination.itemsPerPage,
          hasNextPage: response.pagination.hasNextPage,
          hasPrevPage: response.pagination.hasPrevPage,
          nextPage: response.pagination.nextPage,
          prevPage: response.pagination.prevPage,
        });

        setSelectedTeacher(null);
        setShowEvaluations(null);
        setSelectedAspect(null);
        setSelectedCourse(null);
        setAspectosEvaluados({});
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de los profesores",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [convertirFiltrosAParams, toast]
  );

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  }, []);

  useEffect(() => {
    cargarDatos(filtros);
  }, [filtros, pagination.currentPage, cargarDatos]);

  const handleFiltrosChange = useCallback((nuevosFiltros: FiltrosState) => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setFiltros(nuevosFiltros);
  }, []);

  const limpiarFiltros = useCallback(() => {
    const filtrosLimpiados = {
      configuracionSeleccionada: filtros.configuracionSeleccionada,
      periodoSeleccionado: "",
      sedeSeleccionada: "",
      programaSeleccionado: "",
      semestreSeleccionado: "",
      grupoSeleccionado: "",
    };
    setFiltros(filtrosLimpiados);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [filtros.configuracionSeleccionada]);

  const asignaturasPorSemestre = useCallback((docente: AsignaturaDocente) => {
    const agrupadas: Record<string, typeof docente.asignaturas> = {};

    docente.asignaturas.forEach((asig) => {
      if (!agrupadas[asig.SEMESTRE_PREDOMINANTE]) {
        agrupadas[asig.SEMESTRE_PREDOMINANTE] = [];
      }
      agrupadas[asig.SEMESTRE_PREDOMINANTE].push(asig);
    });

    return agrupadas;
  }, []);

  const filteredTeachers = useMemo(() => {
    let result = docentes;

    if (searchTerm) {
      result = result.filter((teacher) => {
        const matchesName = teacher.DOCENTE.toLowerCase().includes(
          searchTerm.toLowerCase()
        );
        const matchesProgram = teacher.asignaturas.some((asig) =>
          asig.PROGRAMA_PREDOMINANTE.toLowerCase().includes(
            searchTerm.toLowerCase()
          )
        );
        return matchesName || matchesProgram;
      });
    }

    return result;
  }, [docentes, searchTerm]);

  const estadisticas = useMemo(() => {
    const programas = new Set<string>();
    let totalAsignaturas = 0;
    let totalGrupos = 0;

    docentes.forEach((docente) => {
      docente.asignaturas.forEach((asig) => {
        programas.add(asig.PROGRAMA_PREDOMINANTE);
        totalGrupos += asig.grupos.length;
      });
      totalAsignaturas += docente.asignaturas.length;
    });

    return {
      totalProfesores: docentes.length,
      totalProgramas: programas.size,
      totalAsignaturas,
      totalGrupos,
    };
  }, [docentes]);

  // En la función cargarAspectosEvaluados
  const cargarAspectosEvaluados = useCallback(
    async (idDocente: string) => {
      // Verificar si ya tenemos los datos para este docente
      if (aspectosEvaluados[idDocente]) return;

      setLoadingAspectos((prev) => ({ ...prev, [idDocente]: true }));

      try {
        // Validar que tenemos los filtros necesarios
        if (!filtros.configuracionSeleccionada) {
          throw new Error(
            "Se requiere seleccionar una configuración antes de cargar los aspectos evaluados"
          );
        }

        // Preparar los parámetros para la consulta
        const params: FiltersAspectosPuntaje = {
          idDocente,
          idConfiguracion: filtros.configuracionSeleccionada,
          ...(filtros.periodoSeleccionado && {
            periodo: filtros.periodoSeleccionado,
          }),
          ...(filtros.sedeSeleccionada && {
            nombreSede: filtros.sedeSeleccionada,
          }),
          ...(filtros.programaSeleccionado && {
            nomPrograma: filtros.programaSeleccionado,
          }),
          ...(filtros.semestreSeleccionado && {
            semestre: filtros.semestreSeleccionado,
          }),
          ...(filtros.grupoSeleccionado && {
            grupo: filtros.grupoSeleccionado,
          }),
        };

        console.log("Parámetros para cargar aspectos:", params);

        const response = await profesoresService.getAspectosPuntaje(params);

        setAspectosEvaluados((prev) => ({
          ...prev,
          [idDocente]: response.data,
        }));
      } catch (error) {
        console.error("Error al cargar aspectos:", error);

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
        setLoadingAspectos((prev) => ({ ...prev, [idDocente]: false }));
      }
    },
    [aspectosEvaluados, toast, filtros]
  );

  const handleSelectTeacher = useCallback((id: string) => {
    setSelectedTeacher((prevId) => (prevId === id ? null : id));
    setShowEvaluations((prevId) => (prevId === id ? null : prevId));
    setSelectedAspect(null);
    setSelectedCourse(null);
  }, []);

  const toggleEvaluations = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setShowEvaluations((prevId) => {
        const newId = prevId === id ? null : id;
        if (newId) {
          cargarAspectosEvaluados(newId);
        }
        return newId;
      });
      setSelectedAspect(null);
    },
    [cargarAspectosEvaluados]
  );

  const toggleAspect = useCallback(
    (teacherId: string, aspectId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedAspect((prev) =>
        prev?.teacherId === teacherId && prev?.aspectId === aspectId
          ? null
          : { teacherId, aspectId }
      );
    },
    []
  );

  const toggleCourse = useCallback(
    (teacherId: string, courseKey: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedCourse((prev) =>
        prev?.teacherId === teacherId && prev?.courseId === courseKey
          ? null
          : { teacherId, courseId: courseKey }
      );
    },
    []
  );

  const getScoreColor = useCallback((score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-blue-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  }, []);

  const getScoreTextColor = useCallback((score: number) => {
    if (score >= 90) return "text-green-700";
    if (score >= 80) return "text-blue-700";
    if (score >= 70) return "text-yellow-700";
    return "text-red-700";
  }, []);

  const hayFiltrosAplicados = useMemo(() => {
    return (
      filtros.periodoSeleccionado ||
      filtros.sedeSeleccionada ||
      filtros.programaSeleccionado ||
      filtros.semestreSeleccionado ||
      filtros.grupoSeleccionado
    );
  }, [filtros]);

  const getTextoInforme = useCallback(() => {
    const partes = [];

    if (filtros.configuracionSeleccionada) {
      partes.push(`Config. ${filtros.configuracionSeleccionada}`);
    }
    if (filtros.periodoSeleccionado) {
      partes.push(`${filtros.periodoSeleccionado}`);
    }
    if (filtros.sedeSeleccionada) {
      partes.push(filtros.sedeSeleccionada);
    }
    if (filtros.programaSeleccionado) {
      partes.push(filtros.programaSeleccionado);
    }
    if (filtros.semestreSeleccionado) {
      partes.push(`Sem. ${filtros.semestreSeleccionado}`);
    }

    return partes.length > 0 ? partes.join(" - ") : "Informe General";
  }, [filtros]);

  const puedeDescargarInforme = useMemo(() => {
    return !!filtros.sedeSeleccionada && !loadingInforme;
  }, [filtros.sedeSeleccionada, loadingInforme]);

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
        Object.entries(params).filter(
          ([_, value]) => value !== undefined && value !== null
        )
      );

      const response = await apiClient.downloadFile("/informe-docentes", {
        params: filteredParams,
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      const nombreArchivo = `Informe_Docentes_${
        filtros.sedeSeleccionada?.replace(/\s+/g, "_") || "reporte"
      }_${new Date().toISOString().split("T")[0]}.docx`;
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
      console.error("Error al descargar informe:", error);
      let errorMessage =
        "Ocurrió un error al descargar el informe. Por favor, inténtelo de nuevo más tarde.";

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
    );
  }

  return (
    <>
      <header className="bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold">Profesores</h1>
        <p className="text-sm text-gray-500">
          Gestión y evaluación de docentes
        </p>
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

        <Card className="mb-6 shadow-xl border-0 bg-gradient-to-br from-white via-slate-50 to-gray-100 overflow-hidden">
          <CardHeader className="relative bg-gradient-to-br from-white via-slate-50 overflow-hidden text-gray-800">
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-800">
                      Lista de Profesores
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-1">
                      Evaluaciones y desempeño de los docentes
                      {hayFiltrosAplicados && (
                        <span className="ml-2 px-2 py-1 rounded-full text-xs backdrop-blur-sm bg-white/40 text-gray-700">
                          Filtros aplicados
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Button
                    variant="outline"
                    className="bg-white/40 hover:bg-white/60 text-gray-800 border-gray-300 hover:border-gray-500 backdrop-blur-sm shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    onClick={handleDescargarInforme}
                    disabled={!puedeDescargarInforme}
                  >
                    {loadingInforme ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-600"></div>
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
                    <span className="text-xs text-gray-700 text-right max-w-48 bg-white/40 px-2 py-1 rounded backdrop-blur-sm">
                      {getTextoInforme()}
                    </span>
                  ) : (
                    <span className="text-xs text-red-600 text-right bg-red-100 px-2 py-1 rounded backdrop-blur-sm">
                      {loadingInforme
                        ? "Generando informe..."
                        : "Seleccione una sede"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Barra de búsqueda mejorada */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  placeholder="Buscar profesor por nombre..."
                  className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 bg-white shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Estadísticas mejoradas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">
                      Total Profesores
                    </h3>
                    <p className="text-3xl font-bold text-blue-700">
                      {estadisticas.totalProfesores}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500 rounded-lg">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-green-900 mb-1">
                      Programas
                    </h3>
                    <p className="text-3xl font-bold text-green-700">
                      {estadisticas.totalProgramas}
                    </p>
                  </div>
                  <div className="p-3 bg-green-500 rounded-lg">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-purple-900 mb-1">
                      Asignaturas
                    </h3>
                    <p className="text-3xl font-bold text-purple-700">
                      {estadisticas.totalAsignaturas}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500 rounded-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-orange-900 mb-1">
                      Grupos
                    </h3>
                    <p className="text-3xl font-bold text-orange-700">
                      {estadisticas.totalGrupos}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-500 rounded-lg">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de profesores mejorada */}
            <div className="space-y-4">
              {filteredTeachers.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="p-4 bg-white rounded-full w-16 h-16 mx-auto mb-4 shadow-sm">
                    <Search className="w-8 h-8 text-gray-400 mx-auto mt-2" />
                  </div>
                  <p className="text-gray-600 font-medium">
                    {docentes.length === 0 && hayFiltrosAplicados
                      ? "No se encontraron profesores con los filtros aplicados."
                      : "No se encontraron profesores con los criterios de búsqueda."}
                  </p>
                </div>
              ) : (
                filteredTeachers.map((teacher) => {
                  const isSelected = selectedTeacher === teacher.ID_DOCENTE;
                  const showEvals = showEvaluations === teacher.ID_DOCENTE;
                  const asignaturasAgrupadas = asignaturasPorSemestre(teacher);
                  const programaPrincipal =
                    teacher.asignaturas[0]?.PROGRAMA_PREDOMINANTE || "";

                  return (
                    <div
                      key={teacher.ID_DOCENTE}
                      className={`border-2 rounded-xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-lg transform hover:-translate-y-1 ${
                        isSelected
                          ? "border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`p-6 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "bg-gradient-to-r from-indigo-50/50 to-purple-50/50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleSelectTeacher(teacher.ID_DOCENTE)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                isSelected
                                  ? "bg-indigo-500 text-white"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {isSelected ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                                {teacher.DOCENTE.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-gray-800">
                                  {teacher.DOCENTE}
                                </h3>
                                <p className="text-sm text-gray-600 font-medium">
                                  {programaPrincipal}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div
                                className={`text-2xl font-bold ${getScoreTextColor(
                                  teacher.porcentaje_completado
                                )}`}
                              >
                                {teacher.porcentaje_completado}%
                              </div>
                              <div className="text-sm text-gray-500 font-medium">
                                {teacher.evaluaciones_completadas}/
                                {teacher.total_evaluaciones_esperadas}{" "}
                                evaluaciones
                              </div>
                            </div>
                            <div
                              className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                                teacher.estado_evaluacion === "COMPLETADO"
                                  ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300"
                                  : "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300"
                              }`}
                            >
                              {teacher.estado_evaluacion}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">
                              Progreso de evaluaciones
                            </span>
                            <span
                              className={`text-sm font-bold ${getScoreTextColor(
                                teacher.porcentaje_completado
                              )}`}
                            >
                              {teacher.porcentaje_completado}%
                            </span>
                          </div>
                          <div className="relative">
                            <Progress
                              value={teacher.porcentaje_completado}
                              className="h-3 bg-gray-200 rounded-full overflow-hidden"
                              indicatorClassName={`${getScoreColor(
                                teacher.porcentaje_completado
                              )} transition-all duration-500 ease-out rounded-full`}
                            />
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="bg-gradient-to-br from-gray-50 to-white border-t-2 border-indigo-100 p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                              <p className="text-sm text-gray-500 font-medium mb-1">
                                Total Evaluaciones Esperadas
                              </p>
                              <p className="text-2xl font-bold text-gray-800">
                                {teacher.total_evaluaciones_esperadas}
                              </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                              <p className="text-sm text-gray-500 font-medium mb-1">
                                Evaluaciones Completadas
                              </p>
                              <p className="text-2xl font-bold text-green-600">
                                {teacher.evaluaciones_completadas}
                              </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                              <p className="text-sm text-gray-500 font-medium mb-1">
                                Evaluaciones Pendientes
                              </p>
                              <p className="text-2xl font-bold text-orange-600">
                                {teacher.evaluaciones_pendientes}
                              </p>
                            </div>
                          </div>

                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-4">
                              <BookOpen className="h-5 w-5 text-indigo-600" />
                              <h4 className="text-lg font-bold text-gray-800">
                                Asignaturas ({teacher.asignaturas.length})
                              </h4>
                            </div>
                            <div className="space-y-4">
                              {Object.entries(asignaturasAgrupadas).map(
                                ([semestre, asignaturas]) => (
                                  <div
                                    key={semestre}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                                  >
                                    <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                                      <h5 className="font-bold text-lg">
                                        {semestre}
                                      </h5>
                                    </div>
                                    <div className="divide-y divide-gray-200">
                                      {asignaturas.map((asig) => {
                                        const courseKey = `${asig.COD_ASIGNATURA}-${asig.ASIGNATURA}`;
                                        const isSelected =
                                          selectedCourse?.teacherId ===
                                            teacher.ID_DOCENTE &&
                                          selectedCourse?.courseId ===
                                            courseKey;

                                        return (
                                          <div
                                            key={courseKey}
                                            className={`p-4 cursor-pointer transition-all duration-200 ${
                                              isSelected
                                                ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500"
                                                : "hover:bg-gray-50"
                                            }`}
                                            onClick={(e) =>
                                              toggleCourse(
                                                teacher.ID_DOCENTE,
                                                courseKey,
                                                e
                                              )
                                            }
                                          >
                                            <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-100 rounded-lg">
                                                  <BookOpen className="h-4 w-4 text-indigo-600" />
                                                </div>
                                                <div>
                                                  <span className="font-semibold text-gray-800">
                                                    {asig.ASIGNATURA}
                                                  </span>
                                                  <div className="text-sm text-gray-600 font-medium">
                                                    {asig.PROGRAMA_PREDOMINANTE}{" "}
                                                    - {asig.NOMBRE_SEDE}
                                                  </div>
                                                </div>
                                              </div>
                                              <div
                                                className={`text-lg font-bold px-3 py-1 rounded-full ${
                                                  asig.porcentaje_completado >=
                                                  80
                                                    ? "bg-green-100 text-green-700"
                                                    : asig.porcentaje_completado >=
                                                      60
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-red-100 text-red-700"
                                                }`}
                                              >
                                                {asig.porcentaje_completado}%
                                              </div>
                                            </div>
                                            <div className="mt-3">
                                              <Progress
                                                value={
                                                  asig.porcentaje_completado
                                                }
                                                className="h-2 bg-gray-200 rounded-full"
                                                indicatorClassName={`${getScoreColor(
                                                  asig.porcentaje_completado
                                                )} transition-all duration-500 rounded-full`}
                                              />
                                            </div>

                                            {/* Grupos de la asignatura */}
                                            {isSelected && (
                                              <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                                                <h6 className="text-md font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                  <svg
                                                    className="w-4 h-4"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                  >
                                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                                  </svg>
                                                  Grupos ({asig.grupos.length})
                                                </h6>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                  {asig.grupos.map((grupo) => (
                                                    <div
                                                      key={`${asig.COD_ASIGNATURA}-${grupo.GRUPO}`}
                                                      className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 shadow-sm"
                                                    >
                                                      <div className="grid grid-cols-3 gap-3 text-sm">
                                                        <div>
                                                          <p className="text-gray-500 font-medium">
                                                            Grupo:
                                                          </p>
                                                          <p className="font-bold text-indigo-600">
                                                            {grupo.GRUPO}
                                                          </p>
                                                        </div>
                                                        <div>
                                                          <p className="text-gray-500 font-medium">
                                                            Evaluaciones:
                                                          </p>
                                                          <p className="font-bold text-gray-800">
                                                            {
                                                              grupo.evaluaciones_completadas
                                                            }
                                                            /
                                                            {
                                                              grupo.total_evaluaciones_esperadas
                                                            }
                                                          </p>
                                                        </div>
                                                        <div>
                                                          <p className="text-gray-500 font-medium">
                                                            Progreso:
                                                          </p>
                                                          <div className="flex items-center gap-2 mt-1">
                                                            <Progress
                                                              value={
                                                                grupo.porcentaje_completado
                                                              }
                                                              className="h-2 w-full bg-gray-200 rounded-full"
                                                              indicatorClassName={`${getScoreColor(
                                                                grupo.porcentaje_completado
                                                              )} rounded-full`}
                                                            />
                                                            <span
                                                              className={`text-xs font-bold ${getScoreTextColor(
                                                                grupo.porcentaje_completado
                                                              )}`}
                                                            >
                                                              {
                                                                grupo.porcentaje_completado
                                                              }
                                                              %
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
                                        );
                                      })}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                onClick={(e) =>
                                  toggleEvaluations(teacher.ID_DOCENTE, e)
                                }
                                variant={showEvals ? "default" : "outline"}
                                className={`px-6 py-2 font-semibold transition-all duration-200 ${
                                  showEvals
                                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md transform hover:scale-105"
                                    : "border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50"
                                }`}
                              >
                                {showEvals
                                  ? "Ocultar Evaluaciones"
                                  : "Ver Evaluaciones"}
                              </Button>
                            </div>
                          </div>

                          {showEvals && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                  <MessageSquare className="h-5 w-5 text-indigo-600" />
                                  Aspectos Evaluados
                                </h4>
                                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
                                  Total de estudiantes:{" "}
                                  {teacher.total_evaluaciones_esperadas}
                                </div>
                              </div>
                              <div className="space-y-3">
                                {loadingAspectos[teacher.ID_DOCENTE] ? (
                                  <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                                    <p className="text-gray-600 font-medium">
                                      Cargando aspectos evaluados...
                                    </p>
                                  </div>
                                ) : aspectosEvaluados[teacher.ID_DOCENTE]
                                    ?.length > 0 ? (
                                  aspectosEvaluados[teacher.ID_DOCENTE].map(
                                    (aspecto) => {
                                      const puntaje =
                                        parseFloat(aspecto.PUNTAJE_PROMEDIO) *
                                        100;
                                      const isSelected =
                                        selectedAspect?.teacherId ===
                                          teacher.ID_DOCENTE &&
                                        selectedAspect?.aspectId ===
                                          aspecto.ASPECTO;

                                      return (
                                        <div
                                          key={aspecto.ASPECTO}
                                          className="bg-white rounded-lg shadow-sm border border-gray-200"
                                        >
                                          <div
                                            className={`cursor-pointer p-4 rounded-lg transition-all duration-200 ${
                                              isSelected
                                                ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-300"
                                                : "hover:bg-gray-50"
                                            }`}
                                            onClick={(e) =>
                                              toggleAspect(
                                                teacher.ID_DOCENTE,
                                                aspecto.ASPECTO,
                                                e
                                              )
                                            }
                                          >
                                            <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-3">
                                                <div
                                                  className={`p-2 rounded-lg transition-all duration-200 ${
                                                    isSelected
                                                      ? "bg-indigo-500 text-white"
                                                      : "bg-gray-100 text-gray-600"
                                                  }`}
                                                >
                                                  {isSelected ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                  ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                  )}
                                                </div>
                                                <span className="font-semibold text-gray-800">
                                                  {aspecto.ASPECTO}
                                                </span>
                                              </div>
                                              <span
                                                className={`text-lg font-bold px-3 py-1 rounded-full ${
                                                  puntaje >= 80
                                                    ? "bg-green-100 text-green-700"
                                                    : puntaje >= 60
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-red-100 text-red-700"
                                                }`}
                                              >
                                                {puntaje.toFixed(1)}%
                                              </span>
                                            </div>
                                            <div className="mt-3 pl-12">
                                              <Progress
                                                value={puntaje}
                                                className="h-3 bg-gray-200 rounded-full"
                                                indicatorClassName={`${getScoreColor(
                                                  puntaje
                                                )} transition-all duration-500 rounded-full`}
                                              />
                                            </div>
                                          </div>

                                          {isSelected && (
                                            <div className="mx-4 mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-indigo-200">
                                              <div className="flex items-center mb-3">
                                                <MessageSquare className="h-4 w-4 mr-2 text-indigo-600" />
                                                <h6 className="text-sm font-bold text-indigo-800">
                                                  Descripción
                                                </h6>
                                              </div>
                                              <p className="text-sm pl-2 border-l-4 border-indigo-300 bg-white p-3 rounded italic text-gray-700">
                                                {aspecto.descripcion}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                  )
                                ) : (
                                  <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
                                    <div className="p-4 bg-white rounded-full w-16 h-16 mx-auto mb-4 shadow-sm">
                                      <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mt-2" />
                                    </div>
                                    <p className="text-gray-600 font-medium">
                                      No hay aspectos evaluados disponibles.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination mejorada */}
            <div className="mt-8">
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
  );
}
