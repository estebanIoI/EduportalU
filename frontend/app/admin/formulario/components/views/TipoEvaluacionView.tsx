import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { TipoEvaluacion, EstadoActivo } from "@/lib/types/evaluacionInsitu";
import { tiposEvaluacionService } from "@/services";

interface TiposEvaluacionViewProps {
  tiposEvaluacion: TipoEvaluacion[];
  setModalTipoEvaluacion: (value: any) => void;
  handleEliminarTipoEvaluacion: (tipo: TipoEvaluacion) => void;
  refreshTipos: () => void;
}

export function TiposEvaluacionView({
  tiposEvaluacion,
  setModalTipoEvaluacion,
  handleEliminarTipoEvaluacion,
  refreshTipos,
}: TiposEvaluacionViewProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const toggleEstado = async (tipo: TipoEvaluacion) => {
    try {
      setLoadingId(tipo.ID);
      
      const nuevoEstado: EstadoActivo = {
        id: tipo.ID,
        activo: !tipo.ACTIVO ? 1 : 0,
      };

      await tiposEvaluacionService.updateEstado(nuevoEstado);
      refreshTipos();
    } catch (error) {
      console.error("Error al cambiar estado", error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Tipos de Evaluación</CardTitle>
        <CardDescription>
          Administra los tipos de evaluación disponibles en el sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tiposEvaluacion.map((tipo) => (
            <Card
              key={tipo.ID}
              className="transition-shadow duration-200 hover:shadow-lg border border-muted rounded-2xl shadow-sm"
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-semibold text-lg">{tipo.NOMBRE}</h3>
                      <Badge
                        variant={tipo.ACTIVO ? "default" : "destructive"}
                        className="flex items-center gap-1"
                      >
                        {tipo.ACTIVO ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        {tipo.ACTIVO ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tipo.DESCRIPCION}</p>
                  </div>

                  <div className="flex gap-2 self-start items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setModalTipoEvaluacion({
                          isOpen: true,
                          tipo,
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
                      onClick={() => handleEliminarTipoEvaluacion(tipo)}
                      title="Eliminar"
                      className="hover:bg-muted hover:text-primary"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={loadingId === tipo.ID}
                      onClick={() => toggleEstado(tipo)}
                      title={tipo.ACTIVO ? "Desactivar" : "Activar"}
                      className="hover:bg-muted hover:text-primary"
                    >
                      {loadingId === tipo.ID ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : tipo.ACTIVO ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            className="w-full mt-2"
            onClick={() => setModalTipoEvaluacion({ isOpen: true, tipo: undefined })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Nuevo Tipo de Evaluación
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
