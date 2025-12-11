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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tag, Edit3, Plus, AlertCircle } from "lucide-react"
import { Pregunta } from "@/lib/types/evaluacionInsitu"
import { preguntasService } from "@/services"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

interface ModalPreguntaProps {
  isOpen: boolean
  onClose: () => void
  pregunta?: Pregunta
  onSuccess: () => void
}

export function ModalPregunta({
  isOpen,
  onClose,
  pregunta,
  onSuccess
}: ModalPreguntaProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    TEXTO: "",
    TIPO_PREGUNTA: "texto",
    ORDEN: 1,
    ACTIVO: true,
    OPCIONES: ""
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Actualiza el formulario cuando se abre con una nueva pregunta
  useEffect(() => {
    if (pregunta) {
      setFormData({
        TEXTO: pregunta.TEXTO,
        TIPO_PREGUNTA: pregunta.TIPO_PREGUNTA,
        ORDEN: pregunta.ORDEN,
        ACTIVO: pregunta.ACTIVO,
        OPCIONES: pregunta.OPCIONES || ""
      })
    } else {
      setFormData({ 
        TEXTO: "", 
        TIPO_PREGUNTA: "texto",
        ORDEN: 1,
        ACTIVO: true,
        OPCIONES: ""
      })
    }
    setErrors({})
  }, [pregunta, isOpen])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.TEXTO.trim()) {
      newErrors.TEXTO = "El texto de la pregunta es obligatorio"
    } else if (formData.TEXTO.trim().length < 5) {
      newErrors.TEXTO = "El texto debe tener al menos 5 caracteres"
    }

    if (!formData.TIPO_PREGUNTA) {
      newErrors.TIPO_PREGUNTA = "El tipo de pregunta es obligatorio"
    }

    if (formData.ORDEN < 1) {
      newErrors.ORDEN = "El orden debe ser mayor a 0"
    }

    if (["opcion_multiple", "seleccion_unica"].includes(formData.TIPO_PREGUNTA) && !formData.OPCIONES?.trim()) {
      newErrors.OPCIONES = "Las opciones son obligatorias para este tipo de pregunta"
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
      if (pregunta) {
        // Actualizando una pregunta existente
        response = await preguntasService.update(pregunta.ID, formData)
        toast({
          title: "¡Actualización exitosa!",
          description: "La pregunta se actualizó correctamente"
        })
      } else {
        // Creando una nueva pregunta
        response = await preguntasService.create(formData)
        toast({
          title: "¡Creación exitosa!",
          description: "Nueva pregunta creada"
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
            {pregunta ? (
              <>
                <Edit3 className="h-5 w-5 text-primary" />
                <DialogTitle>Editar Pregunta</DialogTitle>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-primary" />
                <DialogTitle>Crear Nueva Pregunta</DialogTitle>
              </>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-2 border-muted">
            <CardContent className="pt-6 space-y-4">
              {/* Texto de la pregunta */}
              <div className="space-y-2">
                <Label htmlFor="texto" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Texto de la Pregunta
                  <Badge variant="outline" className="ml-auto">Obligatorio</Badge>
                </Label>
                <Textarea
                  id="texto"
                  value={formData.TEXTO}
                  onChange={(e) => setFormData({ ...formData, TEXTO: e.target.value })}
                  placeholder="Ingrese el texto de la pregunta"
                  className={errors.TEXTO ? "border-red-500" : ""}
                  rows={3}
                />
                {errors.TEXTO && (
                  <div className="flex items-center gap-1 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.TEXTO}
                  </div>
                )}
              </div>

              {/* Tipo de pregunta */}
              <div className="space-y-2">
                <Label htmlFor="tipo" className="flex items-center gap-2">
                  Tipo de Pregunta
                  <Badge variant="outline" className="ml-auto">Obligatorio</Badge>
                </Label>
                <Select
                  value={formData.TIPO_PREGUNTA}
                  onValueChange={(value) => setFormData({ ...formData, TIPO_PREGUNTA: value })}
                >
                  <SelectTrigger className={errors.TIPO_PREGUNTA ? "border-red-500" : ""}>
                    <SelectValue placeholder="Seleccione un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="texto">Texto Libre</SelectItem>
                    <SelectItem value="texto_largo">Texto Largo</SelectItem>
                    <SelectItem value="seleccion_unica">Selección Única</SelectItem>
                    <SelectItem value="opcion_multiple">Opción Múltiple</SelectItem>
                    <SelectItem value="escala">Escala</SelectItem>
                    <SelectItem value="si_no">Sí/No</SelectItem>
                  </SelectContent>
                </Select>
                {errors.TIPO_PREGUNTA && (
                  <div className="flex items-center gap-1 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.TIPO_PREGUNTA}
                  </div>
                )}
              </div>

              {/* Opciones (solo si es necesario) */}
              {["opcion_multiple", "seleccion_unica"].includes(formData.TIPO_PREGUNTA) && (
                <div className="space-y-2">
                  <Label htmlFor="opciones" className="flex items-center gap-2">
                    Opciones (separadas por comas)
                    <Badge variant="outline" className="ml-auto">Obligatorio</Badge>
                  </Label>
                  <Textarea
                    id="opciones"
                    value={formData.OPCIONES}
                    onChange={(e) => setFormData({ ...formData, OPCIONES: e.target.value })}
                    placeholder="Ej: Opción 1, Opción 2, Opción 3"
                    className={errors.OPCIONES ? "border-red-500" : ""}
                    rows={2}
                  />
                  {errors.OPCIONES && (
                    <div className="flex items-center gap-1 text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {errors.OPCIONES}
                    </div>
                  )}
                </div>
              )}

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
                  Pregunta Activa
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
              ) : pregunta ? (
                "Actualizar"
              ) : (
                "Crear"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
