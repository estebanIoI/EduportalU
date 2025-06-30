"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { configuracionEvaluacionService } from "@/services"
import { ConfiguracionEvaluacion } from "@/lib/types/evaluacionInsitu"
import { vistaAcademicaService } from "@/services"
import { Periodo, Semestre, Programa, Grupo, Sede } from "@/lib/types/vista/vistaAcademicaInsitu"
import { ApiResponse } from "@/lib/types/dashboard/dashboard"

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

function extractData<T extends object>(response: T | ApiResponse<T>): T {
  if ('success' in response && 'data' in response) {
    return response.data
  }
  return response
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
    return fechaISO; // Retornar fecha original si hay error
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
  const [semestres, setSemestres] = useState<Semestre[]>([])
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [programas, setProgramas] = useState<Programa[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [mostrarConfiguracion, setMostrarConfiguracion] = useState(false)

  // Función para obtener el periodo más reciente
  const obtenerPeriodoMasReciente = (periodos: Periodo[]): string | null => {
    if (!periodos || periodos.length === 0) return null;
    
    // Filtrar periodos únicos y válidos
    const periodosUnicos = periodos
      .filter((periodo, index, self) => 
        periodo.PERIODO && 
        self.findIndex(p => p.PERIODO === periodo.PERIODO) === index
      )
      .map(p => p.PERIODO)
      .sort((a, b) => {
        // Separar año y semestre para comparar correctamente
        const [anoA, semestreA] = a.split('-').map(Number);
        const [anoB, semestreB] = b.split('-').map(Number);
        
        // Primero comparar por año, luego por semestre
        if (anoA !== anoB) {
          return anoB - anoA; // Orden descendente por año
        }
        return semestreB - semestreA; // Orden descendente por semestre
      });
    
    return periodosUnicos.length > 0 ? periodosUnicos[0] : null;
  };

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingData(true)
        const [
          configsResponse,
          semestresResponse,
          periodosResponse,
          programasResponse,
          gruposResponse,
          sedesResponse
        ] = await Promise.all([
          configuracionEvaluacionService.getAll(),
          vistaAcademicaService.getSemestres(),
          vistaAcademicaService.getPeriodos(),
          vistaAcademicaService.getProgramas(),
          vistaAcademicaService.getGrupos(),
          vistaAcademicaService.getSedes()
        ])

        const configuracionesData = extractData<ConfiguracionEvaluacion[]>(configsResponse)
        const semestresData = extractData<Semestre[]>(semestresResponse.data)
        const periodosData = extractData<Periodo[]>(periodosResponse.data)
        const programasData = extractData<Programa[]>(programasResponse.data)
        const gruposData = extractData<Grupo[]>(gruposResponse.data)
        const sedesData = extractData<Sede[]>(sedesResponse.data)

        setConfiguraciones(configuracionesData)
        setSemestres(semestresData)
        setPeriodos(periodosData)
        setProgramas(programasData)
        setGrupos(gruposData)
        setSedes(sedesData)

        
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
      console.error("Error cargando datos de filtros:", error)
    } finally {
      setLoadingData(false)
    }
  }

    cargarDatos()
  }, [])

  const handleFiltroChange = (campo: keyof FiltrosState, valor: string | number) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor
    })
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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-gray-900">Filtros</CardTitle>
        <CardDescription className="text-gray-600">
          Selecciona la configuración de evaluación y filtra los datos por criterios específicos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          
          {/* Selector de Configuración */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Configuración *
            </label>
            <select
              value={filtros.configuracionSeleccionada || ""}
              onChange={(e) => handleFiltroChange('configuracionSeleccionada', parseInt(e.target.value))}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Selecciona configuración</option>
              {configuraciones.map((config) => (
                <option key={config.ID} value={config.ID}>
                  {config.TIPO_EVALUACION_NOMBRE} {config.ACTIVO && "(Activa)"}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Periodo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periodo
            </label>
            <select
              value={filtros.periodoSeleccionado}
              onChange={(e) => handleFiltroChange('periodoSeleccionado', e.target.value)}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Todos</option>
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

          {/* Selector de Sede */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sede
            </label>
            <select
              value={filtros.sedeSeleccionada}
              onChange={(e) => handleFiltroChange('sedeSeleccionada', e.target.value)}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Todas</option>
              {sedes
                .filter((sede, index, self) => 
                  sede.NOMBRE_SEDE && 
                  self.findIndex(s => s.NOMBRE_SEDE === sede.NOMBRE_SEDE) === index
                )
                .map((sede, index) => (
                  <option key={`sede-${sede.NOMBRE_SEDE}-${index}`} value={sede.NOMBRE_SEDE}>
                    {sede.NOMBRE_SEDE}
                  </option>
                ))}
            </select>
          </div>

          {/* Selector de Programa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Programa
            </label>
            <select
              value={filtros.programaSeleccionado}
              onChange={(e) => handleFiltroChange('programaSeleccionado', e.target.value)}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Todos</option>
              {programas
                .filter((programa, index, self) => 
                  programa.NOM_PROGRAMA && 
                  self.findIndex(p => p.NOM_PROGRAMA === programa.NOM_PROGRAMA) === index
                )
                .map((programa, index) => (
                  <option key={`programa-${programa.NOM_PROGRAMA}-${index}`} value={programa.NOM_PROGRAMA}>
                    {programa.NOM_PROGRAMA}
                  </option>
                ))}
            </select>
          </div>

          {/* Selector de Semestre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semestre
            </label>
            <select
              value={filtros.semestreSeleccionado}
              onChange={(e) => handleFiltroChange('semestreSeleccionado', e.target.value)}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Todos</option>
              {semestres
                .filter((semestre, index, self) => 
                  semestre.SEMESTRE && 
                  self.findIndex(s => s.SEMESTRE === semestre.SEMESTRE) === index
                )
                .map((semestre, index) => (
                  <option key={`semestre-${semestre.SEMESTRE}-${index}`} value={semestre.SEMESTRE}>
                    {semestre.SEMESTRE}
                  </option>
                ))}
            </select>
          </div>

          {/* Selector de Grupo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grupo
            </label>
            <select
              value={filtros.grupoSeleccionado}
              onChange={(e) => handleFiltroChange('grupoSeleccionado', e.target.value)}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Todos</option>
              {grupos
                .filter((grupo, index, self) => 
                  grupo.GRUPO && 
                  self.findIndex(g => g.GRUPO === grupo.GRUPO) === index
                )
                .map((grupo, index) => (
                  <option key={`grupo-${grupo.GRUPO}-${index}`} value={grupo.GRUPO}>
                    {grupo.GRUPO}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Botón para mostrar/ocultar información de la configuración */}
        {configuracionSeleccionada && (
          <div className="mb-4">
            <button
              onClick={() => setMostrarConfiguracion(!mostrarConfiguracion)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium text-sm"
            >
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${mostrarConfiguracion ? 'rotate-90' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {mostrarConfiguracion ? 'Ocultar' : 'Ver'} información de la configuración
            </button>
          </div>
        )}

        {/* Información de la configuración seleccionada (colapsible) */}
        {configuracionSeleccionada && mostrarConfiguracion && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 transition-all duration-300 ease-in-out">
            <div className="space-y-3">
              <h4 className="text-blue-900 font-semibold text-base mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                {configuracionSeleccionada.TIPO_EVALUACION_NOMBRE}
                <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${
                  configuracionSeleccionada.ACTIVO 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {configuracionSeleccionada.ACTIVO ? 'Activa' : 'Inactiva'}
                </span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-blue-600">📅</span>
                  <span className="font-medium">Inicio:</span>
                  <span>{formatearFecha(configuracionSeleccionada.FECHA_INICIO)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-blue-600">🏁</span>
                  <span className="font-medium">Fin:</span>
                  <span>{formatearFecha(configuracionSeleccionada.FECHA_FIN)}</span>
                </div>
              </div>

              {configuracionSeleccionada.TIPO_EVALUACION_DESCRIPCION && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 mt-0.5">📝</span>
                    <div>
                      <span className="font-medium">Descripción:</span>
                      <p className="mt-1 text-gray-600 leading-relaxed">
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
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={onLimpiarFiltros}
            disabled={loading}
            className="px-6"
          >
            Limpiar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}