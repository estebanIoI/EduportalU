import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tag, Edit3, Plus, AlertCircle } from "lucide-react"
import { AspectoEvaluacion } from "@/lib/types/evaluacionInsitu"
import { aspectosEvaluacionService } from "@/services"
import { useToast } from "@/hooks/use-toast"

interface ModalAspectoProps {
  isOpen: boolean
  onClose: () => void
  aspecto?: AspectoEvaluacion
  onSuccess: () => void
}

export function ModalAspecto({
  isOpen,
  onClose,
  aspecto,
  onSuccess
}: ModalAspectoProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    ETIQUETA: "",
    DESCRIPCION: ""
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // 🧠 Actualiza el formulario cuando se abre con un nuevo aspecto
  useEffect(() => {
    if (aspecto) {
      setFormData({
        ETIQUETA: aspecto.ETIQUETA,
        DESCRIPCION: aspecto.DESCRIPCION
      })
    } else {
      setFormData({ ETIQUETA: "", DESCRIPCION: "" })
    }
    setErrors({})
  }, [aspecto, isOpen])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.ETIQUETA.trim()) {
      newErrors.ETIQUETA = "La etiqueta es obligatoria"
    } else if (formData.ETIQUETA.trim().length < 3) {
      newErrors.ETIQUETA = "La etiqueta debe tener al menos 3 caracteres"
    }

    if (!formData.DESCRIPCION.trim()) {
      newErrors.DESCRIPCION = "La descripción es obligatoria"
    } else if (formData.DESCRIPCION.trim().length < 10) {
      newErrors.DESCRIPCION = "La descripción debe tener al menos 10 caracteres"
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
      if (aspecto) {
        // Actualizando un aspecto existente
        response = await aspectosEvaluacionService.update(aspecto.ID, formData)
        toast({
          title: "¡Actualización exitosa!",
          description: "El aspecto de evaluación se actualizó correctamente"
        })
      } else {
        // Creando un nuevo aspecto
        response = await aspectosEvaluacionService.create(formData)
        toast({
          title: "¡Creación exitosa!",
          description: "Nuevo aspecto de evaluación creado"
        })
      }

      onSuccess()
      onClose()
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudo completar la operación. Intenta nuevamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center sm:text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {aspecto ? (
                <Edit3 className="h-5 w-5 text-primary" />
              ) : (
                <Plus className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">
                {aspecto ? "Editar Aspecto de Evaluación" : "Nuevo Aspecto de Evaluación"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {aspecto 
                  ? "Modifica la información del aspecto de evaluación"
                  : "Crea un nuevo aspecto para evaluar en las inspecciones"
                }
              </p>
            </div>
          </div>
        </DialogHeader>

        <Card className="border-0 shadow-none bg-muted/20">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo Etiqueta */}
              <div className="space-y-3">
                <Label htmlFor="etiqueta" className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  Etiqueta del Aspecto
                </Label>
                <Input
                  id="etiqueta"
                  value={formData.ETIQUETA}
                  onChange={(e) => handleInputChange("ETIQUETA", e.target.value)}
                  placeholder="Ej. Infraestructura, Documentación, Procesos..."
                  className={`transition-colors ${errors.ETIQUETA ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  required
                />
                {errors.ETIQUETA && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.ETIQUETA}
                  </div>
                )}
              </div>

              {/* Campo Descripción */}
              <div className="space-y-3">
                <Label htmlFor="descripcion" className="text-sm font-medium flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-primary" />
                  Descripción del Aspecto
                </Label>
                <Textarea
                  id="descripcion"
                  value={formData.DESCRIPCION}
                  onChange={(e) => handleInputChange("DESCRIPCION", e.target.value)}
                  placeholder="Describe qué se evaluará en este aspecto, criterios importantes, elementos a considerar..."
                  rows={4}
                  className={`resize-none transition-colors ${errors.DESCRIPCION ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  required
                />
                <div className="flex justify-between items-center">
                  {errors.DESCRIPCION ? (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {errors.DESCRIPCION}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Mínimo 10 caracteres
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {formData.DESCRIPCION.length}/500
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-2">
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
                {aspecto ? "Actualizando..." : "Creando..."}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {aspecto ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {aspecto ? "Actualizar" : "Crear"}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}