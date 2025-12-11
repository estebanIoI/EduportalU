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
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Edit3, AlertCircle } from "lucide-react"
import { ConfiguracionPregunta, Pregunta } from "@/lib/types/evaluacionInsitu"
import { configuracionPreguntaService, preguntasService } from "@/services"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

interface ModalConfiguracionPreguntaProps {
  isOpen: boolean
  onClose: () => void
  configuracion?: ConfiguracionPregunta
  configuracionEvaluacionId: number
  onSuccess: () => void
}

export function ModalConfiguracionPregunta({
  isOpen,
  onClose,
  configuracion,
  configuracionEvaluacionId,
  onSuccess
}: ModalConfiguracionPreguntaProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    CONFIGURACION_EVALUACION_ID: configuracionEvaluacionId,
    PREGUNTA_ID: 0,
    ORDEN: 1,
    ACTIVO: true,
  })

  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Cargar preguntas disponibles
  useEffect(() => {
    const cargarPreguntas = async () => {
      try {
        const response = await preguntasService.getAll()
        setPreguntas(response.data || [])
      } catch (error) {
        console.error("Error al cargar preguntas", error)
      }
    }

    if (isOpen) {
      cargarPreguntas()
    }
  }, [isOpen])

  // Actualiza el formulario cuando se abre con una configuración existente
  useEffect(() => {
    if (configuracion) {
      setFormData({
        CONFIGURACION_EVALUACION_ID: configuracion.CONFIGURACION_EVALUACION_ID,
        PREGUNTA_ID: configuracion.PREGUNTA_ID,
        ORDEN: configuracion.ORDEN,
        ACTIVO: configuracion.ACTIVO,
      })
    } else {
      setFormData({
        CONFIGURACION_EVALUACION_ID: configuracionEvaluacionId,
        PREGUNTA_ID: 0,
        ORDEN: 1,
        ACTIVO: true,
      })
    }
    setErrors({})
  }, [configuracion, isOpen, configuracionEvaluacionId])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.PREGUNTA_ID || formData.PREGUNTA_ID === 0) {
      newErrors.PREGUNTA_ID = "Debe seleccionar una pregunta"
    }

    if (formData.ORDEN < 1) {
      newErrors.ORDEN = "El orden debe ser mayor a 0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      let response
      if (configuracion) {
        // Actualizando una configuración existente
        response = await configuracionPreguntaService.update(configuracion.ID, formData)
        toast({
          title: "¡Actualización exitosa!",
          description: "La configuración de pregunta se actualizó correctamente"
        })
      } else {
        // Creando una nueva configuración
        response = await configuracionPreguntaService.create(formData)
        toast({
          title: "¡Creación exitosa!",
          description: "Nueva configuración de pregunta creada"
        })
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al procesar la solicitud",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {configuracion ? (
              <>
                <Edit3 className="h-5 w-5 text-primary" />
                <DialogTitle>Editar Configuración de Pregunta</DialogTitle>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-primary" />
                <DialogTitle>Agregar Pregunta a Evaluación</DialogTitle>
              </>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-2 border-muted">
            <CardContent className="pt-6 space-y-4">
              {/* Seleccionar Pregunta */}
              <div className="space-y-2">
                <Label htmlFor="pregunta" className="flex items-center gap-2">
                  Pregunta
                  <Badge variant="outline" className="ml-auto">Obligatorio</Badge>
                </Label>
                <Select
                  value={formData.PREGUNTA_ID && formData.PREGUNTA_ID > 0 ? formData.PREGUNTA_ID.toString() : undefined}
                  onValueChange={(value) => setFormData({ ...formData, PREGUNTA_ID: parseInt(value) })}
                >
                  <SelectTrigger className={errors.PREGUNTA_ID ? "border-red-500" : ""}>
                    <SelectValue placeholder="Seleccione una pregunta" />
                  </SelectTrigger>
                  <SelectContent>
                    {preguntas.filter(p => p.ACTIVO).map((pregunta) => (
                      <SelectItem key={pregunta.ID} value={pregunta.ID.toString()}>
                        {pregunta.TEXTO} ({pregunta.TIPO_PREGUNTA})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.PREGUNTA_ID && (
                  <div className="flex items-center gap-1 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.PREGUNTA_ID}
                  </div>
                )}
              </div>

              {/* Orden */}
              <div className="space-y-2">
                <Label htmlFor="orden" className="flex items-center gap-2">
                  Orden
                  <Badge variant="outline" className="ml-auto">Obligatorio</Badge>
                </Label>
                <Input
                  id="orden"
                  type="number"
                  min="1"
                  value={formData.ORDEN}
                  onChange={(e) => setFormData({ ...formData, ORDEN: parseInt(e.target.value) || 1 })}
                  className={errors.ORDEN ? "border-red-500" : ""}
                />
                {errors.ORDEN && (
                  <div className="flex items-center gap-1 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.ORDEN}
                  </div>
                )}
              </div>

              {/* Activo */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="activo"
                  checked={formData.ACTIVO}
                  onCheckedChange={(checked) => setFormData({ ...formData, ACTIVO: checked as boolean })}
                />
                <Label htmlFor="activo" className="cursor-pointer">
                  Configuración Activa
                </Label>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Procesando...
                </>
              ) : configuracion ? (
                "Actualizar"
              ) : (
                "Agregar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
