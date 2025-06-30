// roles/componentes/modals/ModalRol.tsx
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
import { Shield, Edit3, Plus, AlertCircle, Users } from "lucide-react"
import { Roles } from "@/lib/types/evaluacionInsitu"
import { rolesService } from "@/services/evaluacionITP/auth/roles.service"
import { useToast } from "@/hooks/use-toast"

interface ModalRolProps {
  isOpen: boolean
  onClose: () => void
  rol?: Roles
  onSuccess: () => void
}

export function ModalRol({
  isOpen,
  onClose,
  rol,
  onSuccess
}: ModalRolProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    NOMBRE_ROL: ""
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // 🧠 Actualiza el formulario cuando se abre con un nuevo rol
  useEffect(() => {
    if (rol) {
      setFormData({
        NOMBRE_ROL: rol.NOMBRE_ROL
      })
    } else {
      setFormData({ NOMBRE_ROL: "" })
    }
    setErrors({})
  }, [rol, isOpen])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.NOMBRE_ROL.trim()) {
      newErrors.NOMBRE_ROL = "El nombre del rol es obligatorio"
    } else if (formData.NOMBRE_ROL.trim().length < 3) {
      newErrors.NOMBRE_ROL = "El nombre del rol debe tener al menos 3 caracteres"
    } else if (formData.NOMBRE_ROL.trim().length > 50) {
      newErrors.NOMBRE_ROL = "El nombre del rol no puede exceder 50 caracteres"
    } else if (!/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/.test(formData.NOMBRE_ROL.trim())) {
      newErrors.NOMBRE_ROL = "El nombre del rol solo puede contener letras y espacios"
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
      const dataToSend = {
        NOMBRE_ROL: formData.NOMBRE_ROL.trim()
      }

      let response
      if (rol) {
        // Actualizando un rol existente
        response = await rolesService.update(rol.ID, dataToSend)
        toast({
          title: "¡Actualización exitosa!",
          description: "El rol se actualizó correctamente"
        })
      } else {
        // Creando un nuevo rol
        response = await rolesService.create(dataToSend)
        toast({
          title: "¡Creación exitosa!",
          description: "Nuevo rol creado correctamente"
        })
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "No se pudo completar la operación"
      toast({
        title: "Error al guardar",
        description: errorMessage,
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
              {rol ? (
                <Edit3 className="h-5 w-5 text-primary" />
              ) : (
                <Plus className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                {rol ? "Editar Rol" : "Nuevo Rol"}
                <Shield className="h-5 w-5 text-primary" />
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {rol 
                  ? "Modifica la información del rol del sistema"
                  : "Crea un nuevo rol para los usuarios del sistema"
                }
              </p>
            </div>
          </div>
        </DialogHeader>

        <Card className="border-0 shadow-none bg-muted/20">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo Nombre del Rol */}
              <div className="space-y-3">
                <Label htmlFor="nombre_rol" className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Nombre del Rol
                </Label>
                <Input
                  id="nombre_rol"
                  value={formData.NOMBRE_ROL}
                  onChange={(e) => handleInputChange("NOMBRE_ROL", e.target.value)}
                  placeholder="Ej. Administrador, Editor, Usuario, Supervisor..."
                  className={`transition-colors ${errors.NOMBRE_ROL ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  maxLength={50}
                  required
                />
                <div className="flex justify-between items-center">
                  {errors.NOMBRE_ROL ? (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {errors.NOMBRE_ROL}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Solo letras y espacios, mínimo 3 caracteres
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {formData.NOMBRE_ROL.length}/50
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              {rol && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Información del Rol
                  </Label>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      ID: {rol.ID}
                    </Badge>
                  </div>
                </div>
              )}
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
                {rol ? "Actualizando..." : "Creando..."}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {rol ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {rol ? "Actualizar Rol" : "Crear Rol"}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}