import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pregunta } from "@/lib/types/evaluacionInsitu";
import { Edit, Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PreguntasViewProps {
  preguntas: Pregunta[];
  setModalPregunta: (value: any) => void;
  handleEliminarPregunta: (pregunta: Pregunta) => void;
}

export function PreguntasView({
  preguntas,
  setModalPregunta,
  handleEliminarPregunta,
}: PreguntasViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Preguntas</CardTitle>
        <CardDescription>Administre las preguntas para las encuestas genéricas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {preguntas.map((pregunta) => (
          <Card
            key={pregunta.ID}
            className="transition-all duration-200 hover:shadow-md border border-muted"
          >
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{pregunta.TEXTO}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {pregunta.TIPO_PREGUNTA}
                    </Badge>
                    <Badge variant={pregunta.ACTIVO ? "default" : "destructive"} className="text-xs">
                      {pregunta.ACTIVO ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Orden:</span> {pregunta.ORDEN}
                  </div>
                  {pregunta.OPCIONES && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <span className="font-medium">Opciones:</span> {pregunta.OPCIONES}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 self-start">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setModalPregunta({
                        isOpen: true,
                        pregunta,
                      })
                    }
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEliminarPregunta(pregunta)}
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          className="w-full mt-2"
          onClick={() => setModalPregunta({ isOpen: true, pregunta: undefined })}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Nueva Pregunta
        </Button>
      </CardContent>
    </Card>
  );
}
