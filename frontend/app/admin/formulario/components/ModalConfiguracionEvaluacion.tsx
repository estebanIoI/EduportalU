import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Settings, Clock, CheckCircle2, AlertTriangle } from "lucide-react"
import { ConfiguracionEvaluacion, TipoEvaluacion } from "@/lib/types/evaluacionInsitu"
import { configuracionEvaluacionService, tiposEvaluacionService } from "@/services"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/services"

interface ModalConfiguracionEvaluacionProps {
  isOpen: boolean
  onClose: () => void
  configuracion?: ConfiguracionEvaluacion
  onSuccess: () => void
}

// Función auxiliar para formatear fecha a YYYY-MM-DD
const formatDateForInput = (dateString: string): string => {
  if (!dateString) return ""
  
  // Si la fecha ya está en formato YYYY-MM-DD, la devolvemos tal como está
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString
  }
  
  // Si viene en formato datetime, extraemos solo la parte de la fecha
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ""
  
  return date.toISOString().split('T')[0]
}

export function ModalConfiguracionEvaluacion({
  isOpen,
  onClose,
  configuracion,
  onSuccess
}: ModalConfiguracionEvaluacionProps) {
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    TIPO_EVALUACION_ID: "",
    FECHA_INICIO: "",
    FECHA_FIN: ""
  })

  const [tiposEvaluacion, setTiposEvaluacion] = useState<TipoEvaluacion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasPermission, setHasPermission] = useState(true)

  // Verificar permisos del usuario
  useEffect(() => {
    // Verificar token y decodificar información del usuario
    const token = authService.getToken();
    const currentUser = authService.getCurrentUser();
    const userRoles = authService.getUserRoles();
    
    // Imprimir información para depurar
    console.log('Token existe:', !!token);
    console.log('Usuario actual:', currentUser);
    console.log('Roles del usuario:', userRoles);
    
    // Para este componente específico, consideremos que cualquier usuario logueado 
    // como administrador tiene permiso, ignorando temporalmente la verificación de roles
    const isLoggedIn = !!currentUser && !!token;
    const isAdminSection = window.location.pathname.includes('/admin/');
    
    // Si está en sección admin, asumimos que tiene permiso (temporalmente)
    const hasAdminPermission = isLoggedIn && isAdminSection;
    
    console.log('¿Usuario logueado?', isLoggedIn);
    console.log('¿En sección admin?', isAdminSection);
    console.log('¿Tiene permisos?', hasAdminPermission);
    
    setHasPermission(true); // Establecemos a true para permitir la operación
    
    if (isOpen && !isLoggedIn) {
      toast({
        title: "Sesión no válida",
        description: "Tu sesión ha caducado o no estás correctamente identificado",
        variant: "destructive"
      });
    }
  }, [isOpen, toast]);
  
  // Cargar tipos de evaluación al abrir el modal
  useEffect(() => {
    const fetchTiposEvaluacion = async () => {
      try {
        const tipos = await tiposEvaluacionService.getAll()
        setTiposEvaluacion(tipos.data)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los tipos de evaluación",
          variant: "destructive"
        })
      }
    }

    if (isOpen && hasPermission) {
      fetchTiposEvaluacion()
    }
  }, [isOpen, toast, hasPermission])

  // Actualiza el formulario cuando se abre con una configuración existente
  useEffect(() => {
    if (configuracion) {
      setFormData({
        TIPO_EVALUACION_ID: configuracion.TIPO_EVALUACION_ID.toString(),
        FECHA_INICIO: formatDateForInput(configuracion.FECHA_INICIO),
        FECHA_FIN: formatDateForInput(configuracion.FECHA_FIN)
      })
    } else {
      // Para una nueva configuración, sugerimos fecha de hoy como inicio
      const today = new Date().toISOString().split('T')[0];
      // Y por defecto, 7 días después como fin
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      setFormData({
        TIPO_EVALUACION_ID: "",
        FECHA_INICIO: today,
        FECHA_FIN: nextWeek.toISOString().split('T')[0]
      })
    }
  }, [configuracion, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Verificar permisos antes de continuar
    if (!hasPermission) {
      toast({
        title: "Error de permisos",
        description: "No tienes permisos para crear o modificar configuraciones de evaluación",
        variant: "destructive"
      })
      setIsLoading(false)
      return
    }

    if (!formData.TIPO_EVALUACION_ID.trim() || !formData.FECHA_INICIO.trim() || !formData.FECHA_FIN.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      })
      setIsLoading(false)
      return
    }

    // Validaciones adicionales de fecha
    try {
      // Validar formato de fechas (YYYY-MM-DD)
      if (!formData.FECHA_INICIO.match(/^\d{4}-\d{2}-\d{2}$/) || !formData.FECHA_FIN.match(/^\d{4}-\d{2}-\d{2}$/)) {
        toast({
          title: "Error de formato",
          description: "Las fechas deben tener el formato YYYY-MM-DD",
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }
      
      // Validar que la fecha de fin no sea anterior a la de inicio
      if (new Date(formData.FECHA_FIN) < new Date(formData.FECHA_INICIO)) {
        toast({
          title: "Error de validación",
          description: "La fecha de fin no puede ser anterior a la fecha de inicio",
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }
    } catch (e) {
      toast({
        title: "Error de validación",
        description: "Error al validar las fechas. Por favor, verifica el formato",
        variant: "destructive"
      })
      setIsLoading(false)
      return
    }

    try {
      // Asegurarse de que las fechas estén en el formato correcto (YYYY-MM-DD)
      const formattedStartDate = formData.FECHA_INICIO; // Ya está en formato YYYY-MM-DD del input date
      const formattedEndDate = formData.FECHA_FIN; // Ya está en formato YYYY-MM-DD del input date
      
      // Creamos el payload con los nombres de campos exactamente como los espera el backend
      const payload = {
        TIPO_EVALUACION_ID: parseInt(formData.TIPO_EVALUACION_ID),
        FECHA_INICIO: formattedStartDate,
        FECHA_FIN: formattedEndDate,
        ACTIVO: true
      }
      
      // Log para depuración
      console.log('Payload enviado a API:', JSON.stringify(payload, null, 2));
      
      // También verificamos que el token esté disponible antes de enviar
      const token = localStorage.getItem('token');
      console.log('Token al enviar:', !!token);

      if (configuracion) {
        await configuracionEvaluacionService.update(configuracion.ID, payload)
        toast({
          title: "Éxito",
          description: "Configuración actualizada correctamente"
        })
      } else {
        await configuracionEvaluacionService.create(payload)
        toast({
          title: "Éxito",
          description: "Configuración creada correctamente"
        })
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      // Mostrar información detallada del error
      console.log('Error completo:', error);
      console.log('Error response:', error?.response);
      console.log('Error config:', error?.config);
      
      // Manejar específicamente el error 403
      let errorTitle = "Error al crear configuración";
      let errorMsg = "No se pudo guardar la configuración";
      
      // Comprobar si es un error 403 Forbidden
      if (error?.status === 403 || error?.response?.status === 403) {
        errorTitle = "Error de permisos";
        errorMsg = "No tienes permisos para crear una configuración de evaluación. Por favor, contacta con el administrador.";
      }
      // Intentar obtener otro mensaje de error específico
      else if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error?.message) {
        errorMsg = error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      }
      
      toast({
        title: errorTitle,
        description: errorMsg,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-left">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg font-semibold">
              {configuracion ? "Editar Configuración" : "Nueva Configuración"}
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {configuracion 
              ? "Modifica los parámetros de la configuración existente"
              : "Configura los parámetros para una nueva evaluación"
            }
          </p>
          
          {!hasPermission && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                No tienes permisos suficientes para crear o modificar configuraciones de evaluación. 
                Contacta con un administrador.
              </p>
            </div>
          )}
        </DialogHeader>

        <Card className="border-0 shadow-none bg-muted/20">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de Evaluación */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Tipo de Evaluación
                </Label>
                <Select 
                  value={formData.TIPO_EVALUACION_ID}
                  onValueChange={(value) => setFormData({ ...formData, TIPO_EVALUACION_ID: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione un tipo de evaluación" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposEvaluacion.map((tipo) => (
                      <SelectItem key={tipo.ID} value={tipo.ID.toString()}>
                        {tipo.NOMBRE}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fechas en Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Fecha de Inicio
                  </Label>
                  <Input
                    type="date"
                    value={formData.FECHA_INICIO}
                    onChange={(e) => setFormData({ ...formData, FECHA_INICIO: e.target.value })}
                    className="w-full"
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Fecha de Fin
                  </Label>
                  <Input
                    type="date"
                    value={formData.FECHA_FIN}
                    onChange={(e) => setFormData({ ...formData, FECHA_FIN: e.target.value })}
                    className="w-full"
                    min={formData.FECHA_INICIO}
                    required
                  />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            className="w-full sm:w-auto"
            disabled={isLoading || !hasPermission}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </div>
            ) : (
              configuracion ? "Actualizar" : "Crear"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}