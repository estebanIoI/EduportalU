import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit,
  Trash2,
  Power,
  PowerOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus
} from "lucide-react";
import { TipoEvaluacion, ConfiguracionEvaluacion, EstadoActivo } from "@/lib/types/evaluacionInsitu";
import { configuracionEvaluacionService } from "@/services";
import { Dispatch, SetStateAction } from "react";

interface ConfiguracionViewProps {
  configuraciones: ConfiguracionEvaluacion[];
  tiposEvaluacion: TipoEvaluacion[];
  setModalConfiguracion: Dispatch<SetStateAction<{
    isOpen: boolean;
    configuracion: ConfiguracionEvaluacion | undefined;
  }>>;
  handleEliminarConfiguracion: (configuracion: ConfiguracionEvaluacion) => Promise<void>;
  refreshConfiguracion: () => void;
}

export function ConfiguracionView({
  configuraciones,
  tiposEvaluacion,
  setModalConfiguracion,
  handleEliminarConfiguracion,
  refreshConfiguracion,
}: ConfiguracionViewProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const toggleEstado = async (config: ConfiguracionEvaluacion) => {
    try {
      setLoadingId(config.ID);

      const nuevoEstado: EstadoActivo = {
        id: config.ID,
        activo: !config.ACTIVO ? 1 : 0,
      };

      await configuracionEvaluacionService.updateEstado(nuevoEstado);
      refreshConfiguracion();
    } catch (error) {
      console.error("Error al cambiar estado", error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Evaluación</CardTitle>
        <CardDescription>
          Configure los parámetros generales de la evaluación.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {configuraciones.map((configuracion) => {
            const tipoEvaluacion = tiposEvaluacion.find(
              (tipo) => tipo.ID === configuracion.TIPO_EVALUACION_ID
            );

            return (
              <Card
                key={configuracion.ID}
                className="transition-shadow duration-200 hover:shadow-lg border border-muted rounded-2xl shadow-sm"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-semibold text-lg">
                          Evaluación: {tipoEvaluacion?.NOMBRE || "Desconocida"}
                        </h3>
                        <Badge
                          variant={configuracion.ACTIVO ? "default" : "destructive"}
                          className="flex items-center gap-1"
                        >
                          {configuracion.ACTIVO ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          {configuracion.ACTIVO ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mt-1 space-y-1">
                        <span className="block pl-4">
                          • Inicio:{" "}
                          <span className="font-medium">
                            {new Date(configuracion.FECHA_INICIO).toLocaleDateString("es-ES")}
                          </span>
                        </span>
                        <span className="block pl-4">
                          • Fin:{" "}
                          <span className="font-medium">
                            {new Date(configuracion.FECHA_FIN).toLocaleDateString("es-ES")}
                          </span>
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-2 self-start items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setModalConfiguracion({
                            isOpen: true,
                            configuracion
                          })
                        }
                        title="Editar"
                        className="hover:bg-muted hover:text-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEliminarConfiguracion(configuracion)}
                        title="Eliminar"
                        className="hover:bg-muted hover:text-primary"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={loadingId === configuracion.ID}
                        onClick={() => toggleEstado(configuracion)}
                        title={configuracion.ACTIVO ? "Desactivar" : "Activar"}
                        className="hover:bg-muted hover:text-primary"
                      >
                        {loadingId === configuracion.ID ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : configuracion.ACTIVO ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Button
            className="w-full mt-2"
            onClick={() => setModalConfiguracion({ isOpen: true, configuracion: undefined })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Nueva Configuración
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
