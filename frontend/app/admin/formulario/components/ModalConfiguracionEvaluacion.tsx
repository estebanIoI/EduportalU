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
import { Calendar, Settings, Clock, CheckCircle2 } from "lucide-react"
import { ConfiguracionEvaluacion, TipoEvaluacion } from "@/lib/types/evaluacionInsitu"
import { configuracionEvaluacionService, tiposEvaluacionService } from "@/services"
import { useToast } from "@/hooks/use-toast"

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

    if (isOpen) {
      fetchTiposEvaluacion()
    }
  }, [isOpen, toast])

  // Actualiza el formulario cuando se abre con una configuración existente
  useEffect(() => {
    if (configuracion) {
      setFormData({
        TIPO_EVALUACION_ID: configuracion.TIPO_EVALUACION_ID.toString(),
        FECHA_INICIO: formatDateForInput(configuracion.FECHA_INICIO),
        FECHA_FIN: formatDateForInput(configuracion.FECHA_FIN)
      })
    } else {
      setFormData({
        TIPO_EVALUACION_ID: "",
        FECHA_INICIO: "",
        FECHA_FIN: ""
      })
    }
  }, [configuracion, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!formData.TIPO_EVALUACION_ID.trim() || !formData.FECHA_INICIO.trim() || !formData.FECHA_FIN.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Todos los campos son obligatorios",
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

    try {
      const payload = {
        ...formData,
        TIPO_EVALUACION_ID: parseInt(formData.TIPO_EVALUACION_ID),
        ACTIVO: true
      }

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
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
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
            disabled={isLoading}
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