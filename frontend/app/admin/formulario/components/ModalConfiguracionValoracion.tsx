import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Star, 
  Edit3, 
  Plus, 
  AlertCircle, 
  Hash, 
  Check, 
  ChevronsUpDown,
  Award
} from "lucide-react";
import {
  ConfiguracionValoracion,
  EscalaValoracion,
} from "@/lib/types/evaluacionInsitu";
import {
  configuracionValoracionService,
  escalasValoracionService,
} from "@/services";
import { useToast } from "@/hooks/use-toast";

interface ModalConfiguracionValoracionProps {
  isOpen: boolean;
  onClose: () => void;
  configuracion?: ConfiguracionValoracion;
  onSuccess: () => void;
  configuracionEvaluacionId: number;
}

export function ModalConfiguracionValoracion({
  isOpen,
  onClose,
  configuracion,
  onSuccess,
  configuracionEvaluacionId,
}: ModalConfiguracionValoracionProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    CONFIGURACION_EVALUACION_ID: string;
    VALORACION_ID: string;
    PUNTAJE: string;
    ORDEN: string;
  }>({
    CONFIGURACION_EVALUACION_ID: "",
    VALORACION_ID: "",
    PUNTAJE: "",
    ORDEN: "",
  });

  const [valoraciones, setValoraciones] = useState<EscalaValoracion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [open, setOpen] = useState(false);

  // Cargar valoraciones disponibles
  useEffect(() => {
    if (!isOpen) return;
    const fetchValoraciones = async () => {
      try {
        const data = await escalasValoracionService.getAll();
        setValoraciones(data.data);
      } catch (error) {
        toast({
          title: "Error al cargar datos",
          description: "No se pudieron cargar las valoraciones disponibles",
          variant: "destructive",
        });
      }
    };
    fetchValoraciones();
  }, [isOpen, toast]);

  // Cargar datos en modo edición
  useEffect(() => {
    if (configuracion) {
      setFormData({
        CONFIGURACION_EVALUACION_ID: configuracionEvaluacionId?.toString() ?? "",
        VALORACION_ID: configuracion.VALORACION_ID?.toString() ?? "",
        PUNTAJE: configuracion.PUNTAJE?.toString() ?? "",
        ORDEN: configuracion.ORDEN?.toString() ?? "",
      });
    } else {
      setFormData({
        CONFIGURACION_EVALUACION_ID: configuracionEvaluacionId?.toString() ?? "",
        VALORACION_ID: "",
        PUNTAJE: "",
        ORDEN: "",
      });
    }
    setErrors({});
  }, [configuracion, configuracionEvaluacionId, isOpen]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.VALORACION_ID) {
      newErrors.VALORACION_ID = "Debe seleccionar una valoración";
    }

    if (!formData.PUNTAJE.trim()) {
      newErrors.PUNTAJE = "El puntaje es obligatorio";
    } else if (isNaN(parseFloat(formData.PUNTAJE))) {
      newErrors.PUNTAJE = "El puntaje debe ser un número válido";
    }

    if (!formData.ORDEN.trim()) {
      newErrors.ORDEN = "El orden es obligatorio";
    } else if (isNaN(parseFloat(formData.ORDEN)) || parseFloat(formData.ORDEN) <= 0) {
      newErrors.ORDEN = "El orden debe ser un número mayor a 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const { CONFIGURACION_EVALUACION_ID, VALORACION_ID, PUNTAJE, ORDEN } = formData;

    const payload: ConfiguracionValoracion = {
      CONFIGURACION_EVALUACION_ID: parseInt(CONFIGURACION_EVALUACION_ID),
      VALORACION_ID: parseInt(VALORACION_ID),
      PUNTAJE: parseFloat(PUNTAJE),
      ORDEN: parseFloat(ORDEN),
      ACTIVO: true,
      ID: configuracion?.ID ?? 0,
    };

    try {
      if (configuracion?.ID) {
        await configuracionValoracionService.update(configuracion.ID, payload);
        toast({
          title: "¡Actualización exitosa!",
          description: "La configuración de valoración se actualizó correctamente",
        });
      } else {
        await configuracionValoracionService.create(payload);
        toast({
          title: "¡Creación exitosa!",
          description: "Nueva configuración de valoración creada",
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("❌ Error al guardar:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo completar la operación. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center sm:text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {configuracion?.ID ? (
                <Edit3 className="h-5 w-5 text-primary" />
              ) : (
                <Plus className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">
                {configuracion?.ID
                  ? "Editar Configuración de Valoración"
                  : "Nueva Configuración de Valoración"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {configuracion?.ID
                  ? "Modifica la configuración de valoración en la evaluación"
                  : "Agrega una nueva valoración a la configuración de evaluación"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Card className="border-0 shadow-none bg-muted/20">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo Valoración */}
              <div className="space-y-3">
                <Label htmlFor="valoracion" className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Escala de Valoración
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className={`w-full justify-between transition-colors ${
                        errors.VALORACION_ID ? 'border-destructive focus:ring-destructive' : ''
                      }`}
                    >
                      {formData.VALORACION_ID
                        ? valoraciones.find((valoracion) => valoracion.ID?.toString() === formData.VALORACION_ID)?.ETIQUETA
                        : "Seleccione una valoración..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 max-h-60 overflow-y-auto">
                    <Command>
                      <CommandInput placeholder="Buscar valoración..." />
                      <CommandEmpty>No se encontraron valoraciones.</CommandEmpty>
                      <CommandGroup>
                        {valoraciones.map((valoracion) => (
                          <CommandItem
                            key={valoracion.ID}
                            value={valoracion.ETIQUETA}
                            onSelect={() => {
                              handleInputChange("VALORACION_ID", valoracion.ID?.toString() || "");
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                formData.VALORACION_ID === valoracion.ID?.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{valoracion.ETIQUETA}</span>
                              {valoracion.DESCRIPCION && (
                                <span className="text-xs text-muted-foreground truncate max-w-xs">
                                  {valoracion.DESCRIPCION}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.VALORACION_ID && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.VALORACION_ID}
                  </div>
                )}
              </div>

              {/* Campo Puntaje */}
              <div className="space-y-3">
                <Label htmlFor="puntaje" className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Puntaje
                </Label>
                <Input
                  id="puntaje"
                  type="number"
                  step="0.01"
                  value={formData.PUNTAJE}
                  onChange={(e) => handleInputChange("PUNTAJE", e.target.value)}
                  placeholder="Ej. 5, 4.5, 3.2..."
                  className={`transition-colors ${
                    errors.PUNTAJE ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                  required
                />
                {errors.PUNTAJE && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.PUNTAJE}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Valor numérico que se asignará a esta valoración
                </div>
              </div>

              {/* Campo Orden */}
              <div className="space-y-3">
                <Label htmlFor="orden" className="text-sm font-medium flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  Orden de Presentación
                </Label>
                <Input
                  id="orden"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.ORDEN}
                  onChange={(e) => handleInputChange("ORDEN", e.target.value)}
                  placeholder="Ej. 1, 2, 3, 1.5..."
                  className={`transition-colors ${
                    errors.ORDEN ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                  required
                />
                {errors.ORDEN && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.ORDEN}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Define el orden en que aparecerá esta valoración durante la evaluación
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
            disabled={isLoading || valoraciones.length === 0}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {configuracion?.ID ? "Actualizando..." : "Creando..."}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {configuracion?.ID ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {configuracion?.ID ? "Actualizar" : "Crear"}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}