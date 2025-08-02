"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { configuracionEvaluacionService } from "@/services"
import { ConfiguracionEvaluacion } from "@/lib/types/evaluacionInsitu"
import { vistaAcademicaService } from "@/services"
import { Periodo } from "@/lib/types/vista/vistaAcademicaInsitu"
import { ApiResponse } from "@/lib/types/api.types"

interface FiltrosState {
  configuracionSeleccionada: number | null
  semestreSeleccionado: string
  periodoSeleccionado: string
  programaSeleccionado: string
  grupoSeleccionado: string
  sedeSeleccionada: string
}

interface FiltrosProps {
  filtros: FiltrosState
  onFiltrosChange: (filtros: FiltrosState) => void
  onLimpiarFiltros: () => void
  loading?: boolean
}

interface OpcionFiltro {
  value: string
  label: string
}

interface OpcionesFiltrosResponse {
  sedes?: OpcionFiltro[]
  programas?: OpcionFiltro[]
  semestres?: OpcionFiltro[]
  grupos?: OpcionFiltro[]
}

interface FiltrosDinamicos {
  periodo: string
  sede?: string
  programa?: string
  semestre?: string
  grupo?: string
}

function extractData<T>(response: ApiResponse<T>): T {
  return response.data
}

// Función para formatear fechas
const formatearFecha = (fechaISO: string): string => {
  try {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return fechaISO;
  }
};

export default function Filtros({ 
  filtros, 
  onFiltrosChange, 
  onLimpiarFiltros, 
  loading = false 
}: FiltrosProps) {
  // Estados para las opciones de los selects
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionEvaluacion[]>([])
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [opcionesFiltros, setOpcionesFiltros] = useState<OpcionesFiltrosResponse>({})
  const [loadingData, setLoadingData] = useState(true)
  const [loadingOpciones, setLoadingOpciones] = useState(false)
  const [mostrarConfiguracion, setMostrarConfiguracion] = useState(false)

  // Función para obtener el periodo más reciente
  const obtenerPeriodoMasReciente = (periodos: Periodo[]): string | null => {
    if (!periodos || periodos.length === 0) return null;
    
    const periodosUnicos = periodos
      .filter((periodo, index, self) => 
        periodo.PERIODO && 
        self.findIndex(p => p.PERIODO === periodo.PERIODO) === index
      )
      .map(p => p.PERIODO)
      .sort((a, b) => {
        const [anoA, semestreA] = a.split('-').map(Number);
        const [anoB, semestreB] = b.split('-').map(Number);
        
        if (anoA !== anoB) {
          return anoB - anoA;
        }
        return semestreB - semestreA;
      });
    
    return periodosUnicos.length > 0 ? periodosUnicos[0] : null;
  };

  // Cargar datos iniciales (configuraciones y periodos)
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        setLoadingData(true)
        const [configsResponse, periodosResponse] = await Promise.all([
          configuracionEvaluacionService.getAll(),
          vistaAcademicaService.getPeriodos()
        ])

        const configuracionesData = extractData<ConfiguracionEvaluacion[]>(configsResponse)
        
        // Fix for the first error: Handle the PeriodosResponse type mismatch
        // Extract data properly from the periodosResponse
        let periodosData: Periodo[] = []
        if (periodosResponse && 'data' in periodosResponse) {
          if (Array.isArray(periodosResponse.data)) {
            periodosData = periodosResponse.data
          } else if (periodosResponse.data && Array.isArray(periodosResponse.data)) {
            periodosData = periodosResponse.data
          }
        }

        setConfiguraciones(configuracionesData)
        setPeriodos(periodosData)

        // Crear un objeto con los nuevos filtros
        let nuevosFiltros = { ...filtros };

        // Si no hay configuración seleccionada, seleccionar la activa por defecto
        if (!filtros.configuracionSeleccionada && Array.isArray(configuracionesData) && configuracionesData.length > 0) {
          const configuracionActiva = configuracionesData.find((config) => config.ACTIVO)
          const configuracionPorDefecto = configuracionActiva || configuracionesData[0]
          nuevosFiltros.configuracionSeleccionada = configuracionPorDefecto.ID;
        }

        // Si no hay periodo seleccionado, seleccionar el más reciente automáticamente
        if (!filtros.periodoSeleccionado && Array.isArray(periodosData) && periodosData.length > 0) {
          const periodoMasReciente = obtenerPeriodoMasReciente(periodosData);
          if (periodoMasReciente) {
            nuevosFiltros.periodoSeleccionado = periodoMasReciente;
          }
        }

        // Aplicar los cambios si hay alguna modificación
        if (nuevosFiltros.configuracionSeleccionada !== filtros.configuracionSeleccionada || 
            nuevosFiltros.periodoSeleccionado !== filtros.periodoSeleccionado) {
          onFiltrosChange(nuevosFiltros);
        }

      } catch (error) {
        console.error("Error cargando datos iniciales:", error)
      } finally {
        setLoadingData(false)
      }
    }

    cargarDatosIniciales()
  }, [])

  // Cargar opciones de filtros dinámicos basados en las selecciones actuales
  useEffect(() => {
    const cargarOpcionesFiltros = async () => {
      // Solo cargar opciones si hay un periodo seleccionado (requerido por el backend)
      if (!filtros.periodoSeleccionado) {
        setOpcionesFiltros({})
        return
      }

      try {
        setLoadingOpciones(true)
        
        // Construir filtros para enviar al backend
        const filtrosDinamicos: FiltrosDinamicos = {
          periodo: filtros.periodoSeleccionado,
          ...(filtros.sedeSeleccionada && { sede: filtros.sedeSeleccionada }),
          ...(filtros.programaSeleccionado && { programa: filtros.programaSeleccionado }),
          ...(filtros.semestreSeleccionado && { semestre: filtros.semestreSeleccionado }),
          ...(filtros.grupoSeleccionado && { grupo: filtros.grupoSeleccionado })
        }

        const response = await vistaAcademicaService.getOpcionesFiltros(filtrosDinamicos)
        
        // Fix for the second error: Handle the response type properly
        let opciones: OpcionesFiltrosResponse = {}
        
        if (response && typeof response === 'object') {
          // If response is ApiResponse type
          if ('data' in response && response.data) {
            opciones = response.data as OpcionesFiltrosResponse
          } 
          // If response is already the data object
          else if ('sedes' in response || 'programas' in response || 'semestres' in response || 'grupos' in response) {
            opciones = response as OpcionesFiltrosResponse
          }
        }
        
        setOpcionesFiltros(opciones)

      } catch (error) {
        console.error("Error cargando opciones de filtros:", error)
        setOpcionesFiltros({})
      } finally {
        setLoadingOpciones(false)
      }
    }

    cargarOpcionesFiltros()
  }, [filtros.periodoSeleccionado, filtros.sedeSeleccionada, filtros.programaSeleccionado, filtros.semestreSeleccionado, filtros.grupoSeleccionado])

  const handleFiltroChange = (campo: keyof FiltrosState, valor: string | number) => {
    const nuevosFiltros = { ...filtros, [campo]: valor }
    
    // Si cambia el periodo, limpiar los demás filtros dependientes
    if (campo === 'periodoSeleccionado') {
      nuevosFiltros.sedeSeleccionada = ''
      nuevosFiltros.programaSeleccionado = ''
      nuevosFiltros.semestreSeleccionado = ''
      nuevosFiltros.grupoSeleccionado = ''
    }
    // Si cambia sede, limpiar filtros que dependen de ella
    else if (campo === 'sedeSeleccionada') {
      nuevosFiltros.programaSeleccionado = ''
      nuevosFiltros.semestreSeleccionado = ''
      nuevosFiltros.grupoSeleccionado = ''
    }
    // Si cambia programa, limpiar filtros que dependen de él
    else if (campo === 'programaSeleccionado') {
      nuevosFiltros.semestreSeleccionado = ''
      nuevosFiltros.grupoSeleccionado = ''
    }
    // Si cambia semestre, limpiar grupo
    else if (campo === 'semestreSeleccionado') {
      nuevosFiltros.grupoSeleccionado = ''
    }
    
    onFiltrosChange(nuevosFiltros)
  }

  // Obtener información de la configuración seleccionada
  const getConfiguracionSeleccionada = (): ConfiguracionEvaluacion | null => {
    if (!filtros.configuracionSeleccionada || !configuraciones.length) return null
    return configuraciones.find(c => c.ID === filtros.configuracionSeleccionada) || null
  }

  const configuracionSeleccionada = getConfiguracionSeleccionada()

  if (loadingData) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-gray-900">Filtros</CardTitle>
          <CardDescription className="text-gray-600">
            Cargando opciones de filtrado...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

return (
  <Card className="mb-8 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
      <CardTitle className="text-xl font-bold flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
        </div>
        Filtros de Evaluación
      </CardTitle>
      <CardDescription className="text-blue-100 mt-2">
        Configura los parámetros de evaluación y personaliza los criterios de filtrado para obtener datos específicos
      </CardDescription>
    </CardHeader>
    
    <CardContent className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-6">
        
        {/* Selector de Configuración */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Configuración
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={filtros.configuracionSeleccionada || ""}
              onChange={(e) => handleFiltroChange('configuracionSeleccionada', parseInt(e.target.value))}
              disabled={loading}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-300 bg-white shadow-sm"
            >
              <option value="">Selecciona configuración</option>
              {configuraciones.map((config) => (
                <option key={config.ID} value={config.ID}>
                  {config.TIPO_EVALUACION_NOMBRE} {config.ACTIVO && "✓ (Activa)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selector de Periodo */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Periodo
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={filtros.periodoSeleccionado}
              onChange={(e) => handleFiltroChange('periodoSeleccionado', e.target.value)}
              disabled={loading}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-300 bg-white shadow-sm"
            >
              <option value="">Selecciona periodo</option>
              {periodos
                .filter((periodo, index, self) => 
                  periodo.PERIODO && 
                  self.findIndex(p => p.PERIODO === periodo.PERIODO) === index
                )
                .map((periodo, index) => (
                  <option key={`periodo-${periodo.PERIODO}-${index}`} value={periodo.PERIODO}>
                    {periodo.PERIODO}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Selector de Sede */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Sede
          </label>
          <div className="relative">
            <select
              value={filtros.sedeSeleccionada}
              onChange={(e) => handleFiltroChange('sedeSeleccionada', e.target.value)}
              disabled={loading || loadingOpciones || !filtros.periodoSeleccionado}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-300 bg-white shadow-sm"
            >
              <option value="">Todas las sedes</option>
              {opcionesFiltros.sedes?.map((sede) => (
                <option key={sede.value} value={sede.value}>
                  {sede.label}
                </option>
              ))}
            </select>
            {loadingOpciones && (
              <div className="absolute -bottom-5 left-0 flex items-center gap-2 text-xs text-blue-600 animate-pulse">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                Cargando opciones...
              </div>
            )}
          </div>
        </div>

        {/* Selector de Programa */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Programa
          </label>
          <div className="relative">
            <select
              value={filtros.programaSeleccionado}
              onChange={(e) => handleFiltroChange('programaSeleccionado', e.target.value)}
              disabled={loading || loadingOpciones || !filtros.periodoSeleccionado}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-300 bg-white shadow-sm"
            >
              <option value="">Todos los programas</option>
              {opcionesFiltros.programas?.map((programa) => (
                <option key={programa.value} value={programa.value}>
                  {programa.label}
                </option>
              ))}
            </select>
            {loadingOpciones && (
              <div className="absolute -bottom-5 left-0 flex items-center gap-2 text-xs text-blue-600 animate-pulse">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                Cargando opciones...
              </div>
            )}
          </div>
        </div>

        {/* Selector de Semestre */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Semestre
          </label>
          <div className="relative">
            <select
              value={filtros.semestreSeleccionado}
              onChange={(e) => handleFiltroChange('semestreSeleccionado', e.target.value)}
              disabled={loading || loadingOpciones || !filtros.periodoSeleccionado}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-300 bg-white shadow-sm"
            >
              <option value="">Todos los semestres</option>
              {opcionesFiltros.semestres?.map((semestre) => (
                <option key={semestre.value} value={semestre.value}>
                  {semestre.label}
                </option>
              ))}
            </select>
            {loadingOpciones && (
              <div className="absolute -bottom-5 left-0 flex items-center gap-2 text-xs text-blue-600 animate-pulse">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                Cargando opciones...
              </div>
            )}
          </div>
        </div>

        {/* Selector de Grupo */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            Grupo
          </label>
          <div className="relative">
            <select
              value={filtros.grupoSeleccionado}
              onChange={(e) => handleFiltroChange('grupoSeleccionado', e.target.value)}
              disabled={loading || loadingOpciones || !filtros.periodoSeleccionado}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-300 bg-white shadow-sm"
            >
              <option value="">Todos los grupos</option>
              {opcionesFiltros.grupos?.map((grupo) => (
                <option key={grupo.value} value={grupo.value}>
                  {grupo.label}
                </option>
              ))}
            </select>
            {loadingOpciones && (
              <div className="absolute -bottom-5 left-0 flex items-center gap-2 text-xs text-blue-600 animate-pulse">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                Cargando opciones...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botón para mostrar/ocultar información de la configuración */}
      {configuracionSeleccionada && (
        <div className="mb-6">
          <button
            onClick={() => setMostrarConfiguracion(!mostrarConfiguracion)}
            className="group flex items-center gap-3 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-xl transition-all duration-200 font-medium text-sm border border-blue-200 hover:border-blue-300 hover:shadow-md"
          >
            <div className="p-1 bg-blue-200 group-hover:bg-blue-300 rounded-lg transition-colors duration-200">
              <svg 
                className={`w-3 h-3 transition-transform duration-300 ${mostrarConfiguracion ? 'rotate-90' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            {mostrarConfiguracion ? 'Ocultar' : 'Ver'} información de la configuración
            <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full group-hover:scale-110 transition-transform duration-200"></div>
          </button>
        </div>
      )}

      {/* Información de la configuración seleccionada (colapsible) */}
      {configuracionSeleccionada && mostrarConfiguracion && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border-2 border-blue-200/50 rounded-2xl p-6 mb-6 transition-all duration-500 ease-out transform shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-blue-900 font-bold text-lg flex items-center gap-3">
                <div className="p-2 bg-blue-200 rounded-xl">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                </div>
                {configuracionSeleccionada.TIPO_EVALUACION_NOMBRE}
              </h4>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
                configuracionSeleccionada.ACTIVO 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  configuracionSeleccionada.ACTIVO ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                {configuracionSeleccionada.ACTIVO ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-blue-100">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 text-sm">Fecha de Inicio</span>
                  <p className="text-gray-900 font-medium">{formatearFecha(configuracionSeleccionada.FECHA_INICIO)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-blue-100">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 text-sm">Fecha de Fin</span>
                  <p className="text-gray-900 font-medium">{formatearFecha(configuracionSeleccionada.FECHA_FIN)}</p>
                </div>
              </div>
            </div>

            {configuracionSeleccionada.TIPO_EVALUACION_DESCRIPCION && (
              <div className="mt-4 pt-4 border-t border-blue-200/50">
                <div className="flex items-start gap-3 p-4 bg-white/60 rounded-xl border border-blue-100">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-700 text-sm block mb-2">Descripción</span>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {configuracionSeleccionada.TIPO_EVALUACION_DESCRIPCION}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botón para limpiar filtros */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onLimpiarFiltros}
          disabled={loading}
          className="px-8 py-2.5 border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700 transition-all duration-200 rounded-xl font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Limpiar Filtros
        </Button>
      </div>
    </CardContent>
  </Card>
)
}