"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/services/evaluacionITP/auth/auth.service"
import { PerfilEstudiante } from "@/lib/types/auth"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { evaluacionesService, evaluacionesGenericasService } from "@/services"
import { configuracionEvaluacionService } from "@/services/evaluacionITP/configuracion/configuracionEvaluacion.service"
import { EvaluacionCreada } from "@/lib/types/evaluacionInsitu";
import { ConfiguracionEvaluacion} from "@/lib/types/evaluacionInsitu"
import { Calendar, Clock, FileText, Star, Timer, AlertCircle, CheckCircle2} from "lucide-react"
import { ModalEvaluacionesCreadas } from "@/app/estudiante/components/ModalEvaluacionesCreadas"
import { Header } from "../components/Header"
import { ConnectionStatus } from "@/components/ConnectionStatus"
import Image from "next/image"

// Función auxiliar para parsear fechas en formato YYYY-MM-DD sin problemas de zona horaria
const parseFechaLocal = (fechaString: string): Date => {
  const match = fechaString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    // Crear fecha usando los componentes directamente (sin zona horaria)
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  // Fallback
  return new Date(fechaString);
};

export default function EstudianteBienvenida() {
  const router = useRouter()
  const { toast } = useToast()
  const [perfil, setPerfil] = useState<PerfilEstudiante | null>(null)
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionEvaluacion[]>([])
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [modalEvaluacionesOpen, setModalEvaluacionesOpen] = useState(false)
  const [evaluacionesCreadas, setEvaluacionesCreadas] = useState<EvaluacionCreada[]>([]);
  const [configuracionIdSeleccionada, setConfiguracionIdSeleccionada] = useState<number | null>(null)
  const [isCreatingEvaluaciones, setIsCreatingEvaluaciones] = useState(false)
  const [evaluacionesCompletadas, setEvaluacionesCompletadas] = useState<Record<number, boolean>>({});

  // Actualizar el tiempo cada minuto para mantener el contador actualizado
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Actualizar cada minuto

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);
        
        // Verificar token primero
        const token = authService.getToken();
        if (!token) {
          setProfileError("No hay sesión activa");
          toast({
            title: "Sesión no encontrada",
            description: "Por favor, inicia sesión nuevamente",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }
        
        const response = await authService.getProfile();
        
        if (response.success && response.data && response.data.tipo === "estudiante") {
          const perfilData = response.data as PerfilEstudiante;
          setPerfil(perfilData);
          setProfileError(null);
        } else {
          setProfileError("Perfil inválido");
          toast({
            title: "Perfil inválido",
            description: "El perfil de usuario no es válido para estudiantes",
            variant: "destructive",
          });
          setTimeout(() => {
            authService.logout();
            window.location.href = '/login';
          }, 2000);
        }
      } catch (error: any) {
        console.error('Error al cargar perfil:', error);
        
        // Mostrar mensaje específico del error
        const errorMessage = error?.message || "No se pudo cargar el perfil del estudiante";
        setProfileError(errorMessage);
        
        toast({
          title: "Error al cargar perfil",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Si es error de autenticación, redirigir al login
        if (error?.status === 401 || error?.error === 'UNAUTHENTICATED') {
          setTimeout(() => {
            authService.logout();
            window.location.href = '/login';
          }, 2000);
        }
      } finally {
        setProfileLoading(false);
      }
    };

    cargarPerfil();
  }, [toast])

  useEffect(() => {
    const cargarConfiguraciones = async () => {
      try {
        setLoading(true)
        const [configResponse, ] = await Promise.all([
          configuracionEvaluacionService.getAll()
        ])
        
        // Fix: Access the data property and ensure it's an array before filtering
        const configuracionesData = Array.isArray(configResponse) 
          ? configResponse 
          : configResponse.data || []
        
        // Filtrar solo configuraciones activas
        const configuracionesActivas = configuracionesData.filter((config: ConfiguracionEvaluacion) => config.ACTIVO)
        setConfiguraciones(configuracionesActivas)
      } catch (error) {
        console.error("Error al cargar configuraciones:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las evaluaciones disponibles",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    cargarConfiguraciones()
  }, [toast])

  useEffect(() => {
    const verificarEstado = async () => {
      if (perfil && configuraciones.length > 0) {
        const estadosCompletadas: Record<number, boolean> = {};
        
        for (const config of configuraciones) {
          // Solo verificar evaluaciones genéricas (no de docentes)
          if (!Boolean(config.ES_EVALUACION_DOCENTE)) {
            try {
              const evaluacionesExistentes = await evaluacionesGenericasService.getByEstudianteAndConfiguracion(
                config.ID
              );
              
              const evaluacionesArray = Array.isArray(evaluacionesExistentes) 
                ? evaluacionesExistentes 
                : (evaluacionesExistentes?.success && evaluacionesExistentes?.data) 
                  ? evaluacionesExistentes.data 
                  : [];
              
              if (evaluacionesArray.length > 0 && evaluacionesArray[0].ESTADO === 'completada') {
                estadosCompletadas[config.ID] = true;
              }
            } catch (error) {
              console.error(`Error al verificar estado de configuración ${config.ID}:`, error);
            }
          }
        }
        
        setEvaluacionesCompletadas(estadosCompletadas);
      }
    }

    verificarEstado()
  }, [perfil, configuraciones])

  const handleLogout = () => {
    // Limpiar datos locales si es necesario
    router.push("/")
  }

  const isEvaluacionVigente = (fechaInicio: string, fechaFin: string) => {
    const ahora = new Date()
    const inicio = parseFechaLocal(fechaInicio)
    // La evaluación finaliza a las 23:59 del día de fin
    const fin = parseFechaLocal(fechaFin)
    fin.setHours(23, 59, 59, 999)
    
    return ahora >= inicio && ahora <= fin
  }

  const getTiempoRestante = (fechaFin: string) => {
    const ahora = new Date()
    // La evaluación finaliza a las 23:59 del día de fin
    const fin = parseFechaLocal(fechaFin)
    fin.setHours(23, 59, 59, 999)
    
    const diferencia = fin.getTime() - ahora.getTime()
    
    if (diferencia <= 0) {
      return { dias: 0, horas: 0, minutos: 0, texto: "Finalizada" }
    }

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60))

    let texto = ""
    if (dias > 0) {
      texto = `${dias} ${dias === 1 ? 'día' : 'días'}, ${horas} ${horas === 1 ? 'hora' : 'horas'}`
    } else if (horas > 0) {
      texto = `${horas} ${horas === 1 ? 'hora' : 'horas'}, ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
    } else {
      texto = `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
    }

    return { dias, horas, minutos, texto }
  }

  const getProgressPercentage = (fechaInicio: string, fechaFin: string) => {
    const ahora = new Date()
    const inicio = parseFechaLocal(fechaInicio)
    // La evaluación finaliza a las 23:59 del día de fin
    const fin = parseFechaLocal(fechaFin)
    fin.setHours(23, 59, 59, 999)
    
    const total = fin.getTime() - inicio.getTime()
    const transcurrido = ahora.getTime() - inicio.getTime()
    const porcentaje = Math.max(0, Math.min(100, (transcurrido / total) * 100))
    return porcentaje
  }

  const getUrgencyLevel = (tiempoRestante: { dias: number, horas: number }) => {
    const totalHoras = tiempoRestante.dias * 24 + tiempoRestante.horas
    
    if (totalHoras <= 24) return 'critical' // Menos de 24 horas
    if (totalHoras <= 72) return 'warning'  // Menos de 3 días
    return 'normal'
  }

  const handleIniciarEvaluacion = async (configuracion: ConfiguracionEvaluacion) => {
    console.log('🔍 Iniciando evaluación:', {
      ID: configuracion.ID,
      ES_EVALUACION_DOCENTE: configuracion.ES_EVALUACION_DOCENTE,
      tipo: typeof configuracion.ES_EVALUACION_DOCENTE,
      esBooleano: Boolean(configuracion.ES_EVALUACION_DOCENTE),
      esNegado: !Boolean(configuracion.ES_EVALUACION_DOCENTE)
    });
    
    if (!perfil) {
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil del estudiante",
        variant: "destructive",
      })
      return
    }

    // Si la evaluación tiene una URL externa, redirigir directamente
    if (configuracion.URL_FORMULARIO) {
      window.open(configuracion.URL_FORMULARIO, '_blank');
      return;
    }

    // Convertir a booleano explícitamente (MySQL devuelve 0/1 en lugar de true/false)
    const esEvaluacionDocente = Boolean(configuracion.ES_EVALUACION_DOCENTE);
    
    // Si NO es evaluación de docente, verificar si ya está completada antes de redirigir
    if (!esEvaluacionDocente) {
      console.log('✅ NO es evaluación de docentes, verificando estado...');
      
      try {
        // Verificar si ya existe una evaluación completada
        const evaluacionesExistentes = await evaluacionesGenericasService.getByEstudianteAndConfiguracion(
          configuracion.ID
        );

        // Normalizar la respuesta
        const evaluacionesArray = Array.isArray(evaluacionesExistentes) 
          ? evaluacionesExistentes 
          : (evaluacionesExistentes?.success && evaluacionesExistentes?.data) 
            ? evaluacionesExistentes.data 
            : [];

        // Si existe y está completada, no permitir el acceso
        if (evaluacionesArray.length > 0 && evaluacionesArray[0].ESTADO === 'completada') {
          toast({
            title: "Evaluación completada",
            description: "Ya has completado esta evaluación previamente.",
            variant: "default",
          });
          return;
        }
      } catch (error) {
        console.error('Error al verificar estado de evaluación:', error);
        // Continuar con el flujo normal si hay error en la verificación
      }
      
      // Si no está completada, redirigir normalmente
      router.push(`/estudiante/evaluacion/${configuracion.ID}`);
      return;
    }
    
    console.log('✅ SÍ es evaluación de docentes, verificando evaluaciones existentes');

    // Para evaluaciones de docentes, continuar con el flujo existente
    setConfiguracionIdSeleccionada(configuracion.ID)
    
    try {
      // Paso 1: Verificar si ya existen evaluaciones para esta configuración
      const evaluacionesExistentes = await evaluacionesService.getByEstudianteByConfiguracion(
        perfil.documento, 
        configuracion.ID
      )

      // Normalizar la respuesta para manejar ambos formatos (Array directo o ApiResponse)
      const evaluacionesArray = Array.isArray(evaluacionesExistentes) 
        ? evaluacionesExistentes 
        : (evaluacionesExistentes?.success && evaluacionesExistentes?.data) 
          ? evaluacionesExistentes.data 
          : [];

      if (evaluacionesArray.length > 0) {
        // Caso: Las evaluaciones ya existen - redirigir al dashboard
        toast({
          title: "Evaluaciones encontradas",
          description: "Redirigiendo a tus evaluaciones pendientes...",
          variant: "default",
        })
        
        // Redirigir al dashboard con el ID de configuración
        router.push(`/estudiante/dashboard/${configuracion.ID}`)
        return
      }

      // Paso 2: No existen evaluaciones - Mostrar modal en modo loading INMEDIATAMENTE
      
      setIsCreatingEvaluaciones(true)
      setEvaluacionesCreadas([])
      setModalEvaluacionesOpen(true)
      
      // Pequeño delay para que se vea la animación de loading
      await new Promise(resolve => setTimeout(resolve, 500))
      
      try {        
        const response = await evaluacionesService.createInsitu({ 
          tipoEvaluacionId: configuracion.ID 
        })
                
        // Verificar que la respuesta no sea null/undefined
        if (!response) {
          throw new Error('El servidor no devolvió una respuesta válida')
        }
        
        // Helper function to normalize response
        const normalizeResponse = (rawResponse: any): { success: boolean, evaluaciones: EvaluacionCreada[], message?: string, isGenericEvaluation?: boolean } => {
          // Case 1: Standard BulkEvaluacionesResponse format
          if (rawResponse.success !== undefined && rawResponse.data?.evaluaciones !== undefined) {
            return {
              success: rawResponse.success,
              evaluaciones: rawResponse.data.evaluaciones,
              message: rawResponse.message,
              isGenericEvaluation: rawResponse.data.isGenericEvaluation || false
            }
          }
          
          // Case 2: Direct array of evaluaciones
          if (Array.isArray(rawResponse)) {
            return {
              success: true,
              evaluaciones: rawResponse,
              message: 'Evaluaciones obtenidas correctamente'
            }
          }
          
          // Case 3: Object with evaluaciones property
          if (rawResponse.evaluaciones && Array.isArray(rawResponse.evaluaciones)) {
            return {
              success: true,
              evaluaciones: rawResponse.evaluaciones,
              message: rawResponse.message || 'Evaluaciones obtenidas correctamente'
            }
          }
          
          // Case 4: Error response or unexpected format
          if (rawResponse.success === false) {
            return {
              success: false,
              evaluaciones: [],
              message: rawResponse.message || rawResponse.error || 'Error desconocido'
            }
          }
          
          // Case 5: Unknown format
          console.warn('🤔 Formato de respuesta desconocido:', rawResponse)
          return {
            success: false,
            evaluaciones: [],
            message: 'Formato de respuesta no reconocido del servidor'
          }
        }
        
        const normalizedResponse = normalizeResponse(response)
        
        // Si es una evaluación genérica, redirigir directamente
        if (normalizedResponse.success && normalizedResponse.isGenericEvaluation) {
          setModalEvaluacionesOpen(false)
          setIsCreatingEvaluaciones(false)
          
          toast({
            title: "Evaluación genérica",
            description: "Redirigiendo al formulario de evaluación...",
            variant: "default",
          })
          
          router.push(`/estudiante/evaluacion/${configuracion.ID}`)
          return
        }
        
        if (normalizedResponse.success && normalizedResponse.evaluaciones.length > 0) {
          
          // Simular un poco más de tiempo para mostrar la animación completa
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          toast({
            title: "¡Evaluaciones creadas!",
            description: `Se crearon ${normalizedResponse.evaluaciones.length} evaluaciones correctamente. Redirigiendo...`,
            variant: "default",
          })
          
          // Cerrar modal y redirigir al dashboard
          setModalEvaluacionesOpen(false)
          setIsCreatingEvaluaciones(false)
          
          // Pequeño delay para que se vea el toast antes de redirigir
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          router.push(`/estudiante/dashboard/${configuracion.ID}`)
          
        } else if (!normalizedResponse.success) {
          
          // Check if it's a "ya existen" type error
          if (normalizedResponse.message?.toLowerCase().includes("ya exist") || 
              normalizedResponse.message?.toLowerCase().includes("already exist")) {
            
            const evaluacionesVerificacion = await evaluacionesService.getByEstudianteByConfiguracion(
              perfil.documento, 
              configuracion.ID
            )

            // Normalizar la respuesta de verificación
            const evaluacionesVerificacionArray = Array.isArray(evaluacionesVerificacion) 
              ? evaluacionesVerificacion 
              : (evaluacionesVerificacion?.success && evaluacionesVerificacion?.data) 
                ? evaluacionesVerificacion.data 
                : [];
                        
            if (evaluacionesVerificacionArray.length > 0) {
              
              await new Promise(resolve => setTimeout(resolve, 1500))
              
              toast({
                title: "Evaluaciones encontradas",
                description: "Tus evaluaciones estaban listas. Redirigiendo...",
                variant: "default",
              })
              
              // Cerrar modal y redirigir al dashboard
              setModalEvaluacionesOpen(false)
              setIsCreatingEvaluaciones(false)
              
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              router.push(`/estudiante/dashboard/${configuracion.ID}`)
              
            } else {
              throw new Error('Inconsistencia de datos: el backend dice que existen pero no se encontraron evaluaciones')
            }
          } else {
            // Otros errores del backend
            throw new Error(normalizedResponse.message || "Error desconocido del servidor")
          }
          
        } else {
          // No success, no evaluaciones
          throw new Error('El servidor no devolvió evaluaciones válidas')
        }
        
      } catch (createError) {
        console.error("❌ Error al crear evaluaciones:", {
          error: createError,
          message: createError instanceof Error ? createError.message : 'Error desconocido',
          stack: createError instanceof Error ? createError.stack : undefined
        })
        
        // Cerrar modal y mostrar error
        setModalEvaluacionesOpen(false)
        setIsCreatingEvaluaciones(false)
        
        let errorMessage = "Error desconocido"
        let errorTitle = "Error de conexión"
        
        if (createError instanceof Error) {
          errorMessage = createError.message
          
          if (createError.message.includes('fetch') || createError.message.includes('network')) {
            errorTitle = "Error de red"
            errorMessage = "No se pudo conectar al servidor. Verifica tu conexión."
          } else if (createError.message.includes('timeout')) {
            errorTitle = "Tiempo agotado"
            errorMessage = "La solicitud tardó demasiado. Intenta nuevamente."
          } else if (createError.message.includes('servidor')) {
            errorTitle = "Error del servidor"
            // Mantener el mensaje original que ya es descriptivo
          }
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        })
      }
      
    } catch (initialError) {
      console.error("❌ Error inicial:", {
        error: initialError,
        message: initialError instanceof Error ? initialError.message : 'Error desconocido'
      })
      setIsCreatingEvaluaciones(false)
      setModalEvaluacionesOpen(false)
      
      toast({
        title: "Error de verificación",
        description: "No se pudo verificar el estado de las evaluaciones.",
        variant: "destructive",
      })
    }
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          {/* Logo Universidad */}
          <div className="mb-8 animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="relative w-64 h-24 animate-pulse-slow">
                <Image
                  src="/img/uniPutumayo/1-logo-azul-PNG.png"
                  alt="Universidad de Putumayo"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
            <div className="h-1 w-32 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 mx-auto rounded-full animate-pulse-slow"></div>
          </div>

          {/* Animación de carga mejorada */}
          <div className="relative mb-6">
            {/* Círculo exterior pulsante */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-blue-500 opacity-20 animate-ping"></div>
            </div>
            
            {/* Círculo intermedio */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-blue-500 opacity-30 animate-pulse"></div>
            </div>
            
            {/* Spinner principal */}
            <div className="relative flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700">
                <div className="h-full w-full rounded-full border-t-4 border-r-4 border-green-400"></div>
              </div>
            </div>
          </div>

          {/* Texto de carga */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white animate-fade-in-up">
              Cargando tus evaluaciones
            </h2>
            <p className="text-gray-300 text-lg animate-fade-in-delay">
              Estamos preparando todo para ti...
            </p>
            
            {/* Puntos animados */}
            <div className="flex justify-center gap-2 mt-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Error de conexión</h3>
            <p className="text-gray-600 mb-6">{profileError}</p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full bg-gray-900 hover:bg-gray-800"
              >
                Reintentar
              </Button>
              <Button 
                onClick={() => {
                  authService.logout();
                  window.location.href = '/login';
                }} 
                variant="outline"
                className="w-full"
              >
                Volver al inicio de sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onLogout={handleLogout}
      />

      {/* Indicador de estado de conexión */}
      <ConnectionStatus />

      <main className="container mx-auto p-6 max-w-6xl">
        {/* Evaluaciones Disponibles */}
        <div className="mb-8">
          <div className="text-center mb-8 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Evaluaciones Disponibles
            </h2>
            <p className="text-gray-600 text-lg">Selecciona una evaluación para completar</p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto mt-4 rounded-full"></div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
                <div className="animate-ping absolute top-2 left-2 h-12 w-12 rounded-full bg-gray-200 opacity-75"></div>
              </div>
            </div>
          ) : configuraciones.length === 0 ? (
            <Card className="max-w-md mx-auto animate-fade-in-up shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="text-center py-20">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">No hay evaluaciones disponibles</h4>
                <p className="text-gray-500 text-lg">
                  No tienes evaluaciones pendientes en este momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {configuraciones.map((configuracion, index) => {
                const vigente = isEvaluacionVigente(configuracion.FECHA_INICIO, configuracion.FECHA_FIN)
                const tiempoRestante = getTiempoRestante(configuracion.FECHA_FIN)
                const progreso = getProgressPercentage(configuracion.FECHA_INICIO, configuracion.FECHA_FIN)
                const urgencyLevel = getUrgencyLevel(tiempoRestante)
                const estaCompletada = evaluacionesCompletadas[configuracion.ID] || false

                return (
                  <Card
                    key={configuracion.ID}
                    className={`relative group transition-all duration-500 hover:scale-105 hover:shadow-2xl rounded-3xl border-2 animate-fade-in-up overflow-hidden ${
                      estaCompletada
                        ? 'bg-green-50 border-green-300 opacity-90'
                        : vigente
                        ? 'bg-white border-gray-200 hover:border-gray-300'
                        : 'bg-gray-50 border-gray-100 opacity-90'
                    }`}
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    {/* Efecto de brillo en hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 group-hover:animate-shimmer -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
                    
                    {/* Badge de estado con animación */}
                    <div className="absolute top-6 right-6 z-10">
                      <Badge
                        variant={estaCompletada ? "default" : vigente ? "default" : "secondary"}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                          estaCompletada
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : vigente
                            ? 'bg-green-100 text-green-700 border-green-200 animate-pulse-slow'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        {estaCompletada ? 'Completada' : vigente ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>

                    <CardHeader className="pb-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full transition-all duration-300 group-hover:scale-110 ${
                          vigente ? 'bg-blue-100 group-hover:bg-blue-200' : 'bg-gray-200'
                        }`}>
                          <Star className={`h-6 w-6 transition-all duration-300 ${
                            vigente ? 'text-blue-600 group-hover:text-blue-700' : 'text-gray-500'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors duration-200">
                            {configuracion.TIPO_EVALUACION_NOMBRE}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">Código #{configuracion.ID}</p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Fechas con iconos mejorados */}
                      <div className="space-y-3 bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="p-2 bg-white rounded-full shadow-sm">
                            <Calendar className="h-4 w-4 text-gray-500" />
                          </div>
                          <div>
                            <span className="text-gray-600 block">Inicio</span>
                            <span className="font-semibold text-gray-900">
                              {parseFechaLocal(configuracion.FECHA_INICIO).toLocaleDateString("es-ES", {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="p-2 bg-white rounded-full shadow-sm">
                            <Clock className="h-4 w-4 text-gray-500" />
                          </div>
                          <div>
                            <span className="text-gray-600 block">Finaliza</span>
                              <span className="font-semibold text-gray-900">
                                {(() => {
                                  const fechaFin = parseFechaLocal(configuracion.FECHA_FIN);
                                  fechaFin.setDate(fechaFin.getDate() - 1); // Restar un día

                                  return fechaFin.toLocaleDateString("es-ES", {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  }) + ' a las 23:59';
                                })()}
                              </span>

                          </div>
                        </div>
                      </div>

                      {/* Progreso mejorado */}
                      {vigente && (
                        <div className="space-y-3 bg-blue-50 rounded-2xl p-4 border border-blue-100">
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-700 font-medium">Progreso del período</span>
                            <span className="font-bold text-blue-900">{Math.round(progreso)}%</span>
                          </div>
                          <div className="relative">
                            <Progress
                              value={progreso}
                              className="h-3 bg-blue-100 rounded-full shadow-inner"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-green-500 to-yellow-400 rounded-full opacity-20 animate-pulse"></div>
                          </div>
                        </div>
                      )}

                      {/* Tiempo restante mejorado con urgencia */}
                      {vigente && tiempoRestante.dias >= 0 && tiempoRestante.texto !== "Finalizada" && (
                        <div className={`rounded-2xl p-4 border-2 transition-all duration-300 ${
                          urgencyLevel === 'critical' 
                            ? 'bg-red-50 border-red-200 animate-pulse-slow' 
                            : urgencyLevel === 'warning'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-green-50 border-green-200'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${
                              urgencyLevel === 'critical' 
                                ? 'bg-red-100' 
                                : urgencyLevel === 'warning'
                                ? 'bg-yellow-100'
                                : 'bg-green-100'
                            }`}>
                              {urgencyLevel === 'critical' ? (
                                <AlertCircle className="h-5 w-5 text-red-600" />
                              ) : (
                                <Timer className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`font-bold text-sm ${
                                urgencyLevel === 'critical' 
                                  ? 'text-red-900' 
                                  : urgencyLevel === 'warning'
                                  ? 'text-yellow-900'
                                  : 'text-green-900'
                              }`}>
                                {urgencyLevel === 'critical' ? '¡Tiempo limitado!' : 'Tiempo restante'}
                              </p>
                              <p className={`text-lg font-semibold ${
                                urgencyLevel === 'critical' 
                                  ? 'text-red-800' 
                                  : urgencyLevel === 'warning'
                                  ? 'text-yellow-800'
                                  : 'text-green-800'
                              }`}>
                                {tiempoRestante.texto}
                              </p>
                              {urgencyLevel === 'critical' && (
                                <p className="text-xs text-red-600 mt-1 animate-bounce">
                                  ¡No olvides completar tu evaluación!
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Botón de acción mejorado */}
                      <div className="pt-2">
                        <Button
                          className={`w-full text-base font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                            estaCompletada
                              ? 'bg-green-100 text-green-700 cursor-not-allowed'
                              : vigente
                              ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                          disabled={!vigente || estaCompletada}
                          onClick={() => handleIniciarEvaluacion(configuracion)}
                        >
                          {estaCompletada ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5" />
                              Evaluación Completada
                            </div>
                          ) : vigente ? (
                            <div className="flex items-center gap-2">
                              <Star className="h-5 w-5" />
                              Iniciar Evaluación
                            </div>
                          ) : (
                            'No Disponible'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        
        <ModalEvaluacionesCreadas
          isOpen={modalEvaluacionesOpen}
          onClose={() => {
            if (!isCreatingEvaluaciones) {
              setModalEvaluacionesOpen(false);
              setEvaluacionesCreadas([]);
            }
          }}
          evaluaciones={evaluacionesCreadas}
          isLoading={isCreatingEvaluaciones}
        />

      </main>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fade-in 0.6s ease-out 0.5s both;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out 0.3s both;
        }
        
        .animate-shimmer {
          animation: shimmer 1s ease-in-out;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}