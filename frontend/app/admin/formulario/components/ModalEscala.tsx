import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Hash, Edit3, Plus, AlertCircle, Star } from "lucide-react"
import { EscalaValoracion } from "@/lib/types/evaluacionInsitu"
import { escalasValoracionService } from "@/services"
import { useToast } from "@/hooks/use-toast"

interface ModalEscalaProps {
  isOpen: boolean
  onClose: () => void
  escala?: EscalaValoracion
  onSuccess: () => void
}

export function ModalEscala({ isOpen, onClose, escala, onSuccess }: ModalEscalaProps) {
  const { toast } = useToast()

  // Estado para el formulario
  const [formData, setFormData] = useState({
    VALOR: "",
    ETIQUETA: "",
    DESCRIPCION: ""
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // 🧠 Actualiza el formulario cuando se abre con una nueva escala
  useEffect(() => {
    if (escala) {
      setFormData({
        VALOR: escala.VALOR,
        ETIQUETA: escala.ETIQUETA,
        DESCRIPCION: escala.DESCRIPCION
      })
    } else {
      setFormData({ VALOR: "", ETIQUETA: "", DESCRIPCION: "" })
    }
    setErrors({})
  }, [escala, isOpen])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.VALOR.trim()) {
      newErrors.VALOR = "El valor es obligatorio"
    } else if (formData.VALOR.trim().length !== 1) {
      newErrors.VALOR = "El valor debe ser un solo carácter"
    }

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

  // Manejador del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      let response
      if (escala) {
        // Actualizando una escala existente
        response = await escalasValoracionService.update(escala.ID, formData)
        toast({
          title: "¡Actualización exitosa!",
          description: "La escala de valoración se actualizó correctamente"
        })
      } else {
        // Creando una nueva escala
        response = await escalasValoracionService.create(formData)
        toast({
          title: "¡Creación exitosa!",
          description: "Nueva escala de valoración creada"
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
              {escala ? (
                <Edit3 className="h-5 w-5 text-primary" />
              ) : (
                <Plus className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">
                {escala ? "Editar Escala de Valoración" : "Nueva Escala de Valoración"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {escala 
                  ? "Modifica la información de la escala de valoración"
                  : "Crea una nueva escala para calificar las evaluaciones"
                }
              </p>
            </div>
          </div>
        </DialogHeader>

        <Card className="border-0 shadow-none bg-muted/20">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo Valor */}
              <div className="space-y-3">
                <Label htmlFor="valor" className="text-sm font-medium flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  Valor de la Escala
                </Label>
                <Input
                  id="valor"
                  value={formData.VALOR}
                  onChange={(e) => handleInputChange("VALOR", e.target.value)}
                  placeholder="Ej. A, B, C..."
                  maxLength={1}
                  className={`transition-colors ${errors.VALOR ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  required
                />
                {errors.VALOR && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.VALOR}
                  </div>
                )}
              </div>

              {/* Campo Etiqueta */}
              <div className="space-y-3">
                <Label htmlFor="etiqueta" className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Etiqueta de la Escala
                </Label>
                <Input
                  id="etiqueta"
                  value={formData.ETIQUETA}
                  onChange={(e) => handleInputChange("ETIQUETA", e.target.value)}
                  placeholder="Ej. Excelente, Bueno, Regular, Deficiente..."
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
                  Descripción de la Escala
                </Label>
                <Textarea
                  id="descripcion"
                  value={formData.DESCRIPCION}
                  onChange={(e) => handleInputChange("DESCRIPCION", e.target.value)}
                  placeholder="Describe qué representa este nivel de valoración, criterios para asignarlo..."
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
                {escala ? "Actualizando..." : "Creando..."}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {escala ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {escala ? "Actualizar" : "Crear"}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}