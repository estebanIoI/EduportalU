import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectoEvaluacion, EscalaValoracion, ConfiguracionEvaluacion, TipoEvaluacion, ConfiguracionAspecto, EstadoActivo } from "@/lib/types/evaluacionInsitu";
import { configuracionAspectoService, configuracionValoracionService } from "@/services";
import { Dispatch, SetStateAction } from "react";
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

interface EvaluacionViewProps {
  configuracionSeleccionada: number | null;
  configuraciones: ConfiguracionEvaluacion[];
  tiposEvaluacion: TipoEvaluacion[];
  setConfiguracionSeleccionada: Dispatch<SetStateAction<number | null>>;
  cargarDatosFiltrados: (configuracionId: number) => Promise<void>;
  setModalConfiguracionAspecto: Dispatch<SetStateAction<{ isOpen: boolean; configuracion: any | undefined }>>;
  setModalConfiguracionValoracion: Dispatch<SetStateAction<{ isOpen: boolean; configuracion: any | undefined }>>;
  configuracionAspectos: any[];
  configuracionValoraciones: any[];
  handleEliminarConfiguracionAspecto: (configuracion: ConfiguracionEvaluacion) => void;
  handleEliminarConfiguracionValoracion: (configuracion: ConfiguracionEvaluacion) => void;
  refreshAspectos: () => void;
}

const formatearFecha = (fechaISO: string) => {
  const fecha = new Date(fechaISO);
  const formateada = fecha.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
  });
  return formateada.charAt(0).toUpperCase() + formateada.slice(1);
};

export function EvaluacionView({
  configuracionSeleccionada,
  configuraciones,
  tiposEvaluacion,
  setConfiguracionSeleccionada,
  cargarDatosFiltrados,
  setModalConfiguracionAspecto,
  setModalConfiguracionValoracion,
  configuracionAspectos,
  configuracionValoraciones,
  handleEliminarConfiguracionAspecto,
  handleEliminarConfiguracionValoracion,
  refreshAspectos,
}: EvaluacionViewProps) {

  const [loadingId, setLoadingId] = useState<number | null>(null);

  const toggleEstado = async (
    item: { ID: number; ACTIVO: number },
    service: { updateEstado: (estado: EstadoActivo) => Promise<any> },
    refresh: () => void
  ) => {
    try {
      setLoadingId(item.ID);

      const nuevoEstado: EstadoActivo = {
        id: item.ID,
        activo: !item.ACTIVO ? 1 : 0,
      };

      await service.updateEstado(nuevoEstado);
      refresh();
    } catch (error) {
      console.error("Error al cambiar estado", error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluación</CardTitle>
        <CardDescription>
          Gestione los aspectos y valoraciones de la configuración seleccionada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="configuracionSelect" className="block text-sm font-medium">
            Seleccionar Configuración
          </label>
          <select
            id="configuracionSelect"
            value={configuracionSeleccionada ?? ""}
            onChange={(e) => {
              const selectedId = Number(e.target.value);
              setConfiguracionSeleccionada(selectedId);
              cargarDatosFiltrados(selectedId);
            }}
            className="w-full border rounded-md p-2 focus:outline-none focus:ring focus:border-primary"
          >
            <option value="" disabled>
              Seleccione una configuración
            </option>
            {configuraciones.map((config) => {
              const tipo = tiposEvaluacion.find(
                (t) => t.ID === config.TIPO_EVALUACION_ID
              );
              return (
                <option key={config.ID} value={config.ID}>
                  {tipo?.NOMBRE || "Tipo desconocido"} - {formatearFecha(config.FECHA_INICIO)} a {formatearFecha(config.FECHA_FIN)}
                </option>
              );
            })}
          </select>
        </div>

        {configuracionSeleccionada && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Aspectos */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Aspectos</h3>
              <div className="space-y-3">
                {configuracionAspectos.map((aspecto) => (
                  <Card key={aspecto.ID} className="border border-muted">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-semibold">{aspecto.ETIQUETA}</h3>
                        <Badge
                          variant={aspecto.ACTIVO ? "default" : "destructive"}
                          className="flex items-center gap-1"
                        >
                          {aspecto.ACTIVO ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          {aspecto.ACTIVO ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setModalConfiguracionAspecto({ isOpen: true, configuracion: aspecto })}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEliminarConfiguracionAspecto(aspecto)}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={loadingId === aspecto.ID}
                          onClick={() => toggleEstado(aspecto, configuracionAspectoService, refreshAspectos)}
                          title={aspecto.ACTIVO ? "Desactivar" : "Activar"}
                          className="hover:bg-muted hover:text-primary"
                        >
                          {loadingId === aspecto.ID ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : aspecto.ACTIVO ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  className="w-full"
                  onClick={() =>
                    setModalConfiguracionAspecto({
                      isOpen: true,
                      configuracion: { CONFIGURACION_EVALUACION_ID: configuracionSeleccionada },
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Aspecto
                </Button>
              </div>
            </div>

            {/* Valoraciones */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Valoraciones</h3>
              <div className="space-y-3">
                {configuracionValoraciones.map((valoracion) => (
                  <Card key={valoracion.ID} className="border border-muted">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <h3 className="font-semibold">{valoracion.ETIQUETA}</h3>
                        <Badge
                          variant={valoracion.ACTIVO ? "default" : "destructive"}
                          className="flex items-center gap-1"
                        >
                          {valoracion.ACTIVO ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          {valoracion.ACTIVO ? "Activo" : "Inactivo"}
                        </Badge>
                        <span className="w-full text-sm text-muted-foreground pl-4">
                          • Puntaje: {valoracion.PUNTAJE}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setModalConfiguracionValoracion({ isOpen: true, configuracion: valoracion })
                          }
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEliminarConfiguracionValoracion(valoracion)}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={loadingId === valoracion.ID}
                          onClick={() => toggleEstado(valoracion, configuracionValoracionService, () => cargarDatosFiltrados(configuracionSeleccionada!))}
                          title={valoracion.ACTIVO ? "Desactivar" : "Activar"}
                          className="hover:bg-muted hover:text-primary"
                        >
                          {loadingId === valoracion.ID ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : valoracion.ACTIVO ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  className="w-full"
                  onClick={() =>
                    setModalConfiguracionValoracion({
                      isOpen: true,
                      configuracion: { CONFIGURACION_EVALUACION_ID: configuracionSeleccionada },
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Valoración
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
