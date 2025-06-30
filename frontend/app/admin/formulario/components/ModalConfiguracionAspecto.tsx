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
import { Settings, Edit3, Plus, AlertCircle, Hash, Check, ChevronsUpDown } from "lucide-react";
import {
  ConfiguracionAspecto,
  AspectoEvaluacion,
} from "@/lib/types/evaluacionInsitu";
import {
  configuracionAspectoService,
  aspectosEvaluacionService,
} from "@/services";
import { useToast } from "@/hooks/use-toast";

interface ModalConfiguracionAspectoProps {
  isOpen: boolean;
  onClose: () => void;
  configuracion?: ConfiguracionAspecto;
  onSuccess: () => void;
  configuracionEvaluacionId: number;
}

export function ModalConfiguracionAspecto({
  isOpen,
  onClose,
  configuracion,
  onSuccess,
  configuracionEvaluacionId,
}: ModalConfiguracionAspectoProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    CONFIGURACION_EVALUACION_ID: string;
    ASPECTO_ID: string;
    ORDEN: string;
  }>({
    CONFIGURACION_EVALUACION_ID: "",
    ASPECTO_ID: "",
    ORDEN: "",
  });

  const [aspectos, setAspectos] = useState<AspectoEvaluacion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [open, setOpen] = useState(false);

  // Cargar aspectos disponibles
  useEffect(() => {
    if (!isOpen) return;
    const fetchAspectos = async () => {
      try {
        const data = await aspectosEvaluacionService.getAll();
        setAspectos(data.data);
      } catch (error) {
        toast({
          title: "Error al cargar datos",
          description: "No se pudieron cargar los aspectos disponibles",
          variant: "destructive",
        });
      }
    };
    fetchAspectos();
  }, [isOpen, toast]);

  // Cargar datos en modo edición
  useEffect(() => {
    if (configuracion) {
      setFormData({
        CONFIGURACION_EVALUACION_ID: configuracionEvaluacionId?.toString() ?? "",
        ASPECTO_ID: configuracion.ASPECTO_ID?.toString() ?? "",
        ORDEN: configuracion.ORDEN?.toString() ?? "",
      });
    } else {
      setFormData({
        CONFIGURACION_EVALUACION_ID: configuracionEvaluacionId?.toString() ?? "",
        ASPECTO_ID: "",
        ORDEN: "",
      });
    }
    setErrors({});
  }, [configuracion, configuracionEvaluacionId, isOpen]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.ASPECTO_ID) {
      newErrors.ASPECTO_ID = "Debe seleccionar un aspecto";
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

    const { CONFIGURACION_EVALUACION_ID, ASPECTO_ID, ORDEN } = formData;

    const payload: ConfiguracionAspecto = {
      CONFIGURACION_EVALUACION_ID: parseInt(CONFIGURACION_EVALUACION_ID),
      ASPECTO_ID: parseInt(ASPECTO_ID),
      ORDEN: parseFloat(ORDEN),
      ACTIVO: true,
      ID: configuracion?.ID ?? 0,
    };

    try {
      if (configuracion?.ID) {
        await configuracionAspectoService.update(configuracion.ID, payload);
        toast({
          title: "¡Actualización exitosa!",
          description: "La configuración de aspecto se actualizó correctamente",
        });
      } else {
        await configuracionAspectoService.create(payload);
        toast({
          title: "¡Creación exitosa!",
          description: "Nueva configuración de aspecto creada",
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
                  ? "Editar Configuración de Aspecto"
                  : "Nueva Configuración de Aspecto"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {configuracion?.ID
                  ? "Modifica la configuración del aspecto en la evaluación"
                  : "Agrega un nuevo aspecto a la configuración de evaluación"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Card className="border-0 shadow-none bg-muted/20">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo Aspecto */}
              <div className="space-y-3">
                <Label htmlFor="aspecto" className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  Aspecto de Evaluación
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className={`w-full justify-between transition-colors ${
                        errors.ASPECTO_ID ? 'border-destructive focus:ring-destructive' : ''
                      }`}
                    >
                      {formData.ASPECTO_ID
                        ? aspectos.find((aspecto) => aspecto.ID?.toString() === formData.ASPECTO_ID)?.ETIQUETA
                        : "Seleccione un aspecto a evaluar..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 max-h-60 overflow-y-auto">
                    <Command>
                      <CommandInput placeholder="Buscar aspecto..." />
                      <CommandEmpty>No se encontraron aspectos.</CommandEmpty>
                      <CommandGroup>
                        {aspectos.map((aspecto) => (
                          <CommandItem
                            key={aspecto.ID}
                            value={aspecto.ETIQUETA}
                            onSelect={() => {
                              handleInputChange("ASPECTO_ID", aspecto.ID?.toString() || "");
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                formData.ASPECTO_ID === aspecto.ID?.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{aspecto.ETIQUETA}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-xs">
                                {aspecto.DESCRIPCION}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.ASPECTO_ID && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.ASPECTO_ID}
                  </div>
                )}
              </div>

              {/* Campo Orden */}
              <div className="space-y-3">
                <Label htmlFor="orden" className="text-sm font-medium flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  Orden de Evaluación
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
                  Define el orden en que aparecerá este aspecto durante la evaluación
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
            disabled={isLoading || aspectos.length === 0}
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