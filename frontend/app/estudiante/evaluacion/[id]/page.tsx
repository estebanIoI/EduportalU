"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { tiposEvaluacionService, evaluacionesGenericasService } from "@/services";
import { authService } from "@/services";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AlertCircle, CheckCircle2, FileText } from "lucide-react";

import type {
  ConfiguracionResponse,
} from "@/lib/types/evaluacionInsitu";

export default function EvaluacionGenericaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [evaluaciones, setEvaluaciones] = useState<Record<number, string>>({});
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  const [respuestas, setRespuestas] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [config, setConfig] = useState<ConfiguracionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [openAspecto, setOpenAspecto] = useState<number | null>(null);
  const [perfil, setPerfil] = useState<any>(null);
  const [evaluacionCompletada, setEvaluacionCompletada] = useState(false);
  const [verificandoEstado, setVerificandoEstado] = useState(true);

  // Desenrolla params usando React.use()
  const unwrappedParams = React.use(params);
  const id = Number(unwrappedParams.id);

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const response = await authService.getProfile();
        if (response.success && response.data) {
          setPerfil(response.data);
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      }
    };
    cargarPerfil();
  }, []);

  // Verificar si la evaluación ya está completada
  useEffect(() => {
    const verificarEstadoEvaluacion = async () => {
      if (!perfil) return;
      
      try {
        setVerificandoEstado(true);
        const response = await evaluacionesGenericasService.getByEstudianteAndConfiguracion(id);
        
        // Normalizar la respuesta
        const evaluaciones = Array.isArray(response) 
          ? response 
          : (response?.success && response?.data) 
            ? response.data 
            : [];
        
        // Si existe una evaluación completada, marcar como completada
        if (evaluaciones.length > 0 && evaluaciones[0].ESTADO === 'completada') {
          setEvaluacionCompletada(true);
          toast({
            title: "Evaluación completada",
            description: "Ya has completado esta evaluación previamente.",
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Error al verificar estado de evaluación:", error);
      } finally {
        setVerificandoEstado(false);
      }
    };
    
    verificarEstadoEvaluacion();
  }, [perfil, id, toast]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await tiposEvaluacionService.getConfiguracion(id);
        console.log('Configuración recibida:', data.data);
        console.log('Preguntas:', data.data.preguntas);
        setConfig(data.data);
      } catch (err) {
        toast({
          title: "Error",
          description: "No se pudo cargar la configuración de la evaluación.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!config) return;

    // Verificar que todos los aspectos tengan evaluación (solo si hay aspectos)
    if (config.aspectos && config.aspectos.length > 0) {
      const todosEvaluados = config.aspectos.every(
        (aspecto) => evaluaciones[aspecto.ID]
      );

      if (!todosEvaluados) {
        toast({
          title: "Evaluación incompleta",
          description: "Por favor, evalúa todos los aspectos antes de enviar.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Construir el payload para enviar
      const aspectosData = config.aspectos && config.aspectos.length > 0
        ? config.aspectos
            .filter(aspecto => evaluaciones[aspecto.ID])
            .map((aspecto) => ({
              aspectoId: aspecto.ID,
              valoracionId: Number(evaluaciones[aspecto.ID]),
              comentario: comentarios[aspecto.ID] || "",
            }))
        : [];

      const respuestasData = config.preguntas && config.preguntas.length > 0
        ? config.preguntas
            .filter(pregunta => respuestas[pregunta.ID])
            .map((pregunta) => ({
              preguntaId: pregunta.ID,
              respuesta: respuestas[pregunta.ID],
            }))
        : [];

      console.log('🔍 Estado de respuestas:', respuestas);
      console.log('🔍 Preguntas disponibles:', config.preguntas);
      console.log('🔍 RespuestasData generadas:', respuestasData);

      const payload = {
        configuracionId: id,
        comentarioGeneral: comentarios["COMENTARIO_GENERAL"] || "",
        aspectos: aspectosData,
        respuestas: respuestasData,
      };

      console.log("Payload a enviar:", payload);

      // Enviar la evaluación genérica
      await evaluacionesGenericasService.createBulk(payload);
      
      toast({
        title: "Evaluación enviada",
        description: "Tu evaluación ha sido enviada exitosamente.",
      });

      // Redirigir a la página de bienvenida
      setTimeout(() => {
        router.push("/estudiante/bienvenida");
      }, 1500);
    } catch (error: any) {
      console.error("Error al enviar evaluación:", error);
      toast({
        title: "Error",
        description: error?.message || "Hubo un problema al enviar la evaluación. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRadioChange = (aspectoId: number, value: string) => {
    setEvaluaciones((prev) => ({
      ...prev,
      [aspectoId]: value,
    }));
  };

  const handleComentarioChange = (aspectoId: number, value: string) => {
    setComentarios((prev) => ({
      ...prev,
      [aspectoId]: value,
    }));
  };

  const handleRespuestaChange = (preguntaId: number, value: string) => {
    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: value,
    }));
  };

  if (loading || verificandoEstado) {
    return (
      <ProtectedRoute>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            {loading ? "Cargando configuración..." : "Verificando estado de evaluación..."}
          </p>
        </div>
      </ProtectedRoute>
    );
  }

  if (!config) {
    return (
      <ProtectedRoute>
        <div className="p-8 text-center text-red-600">
          No se encontró la configuración.
        </div>
      </ProtectedRoute>
    );
  }

  // Si la evaluación ya está completada, mostrar mensaje y botón para regresar
  if (evaluacionCompletada) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-lg">
            <CardContent className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Evaluación Completada
              </h3>
              <p className="text-gray-600 mb-6">
                Ya has completado esta evaluación previamente. No es posible volver a realizarla.
              </p>
              <Button
                onClick={() => router.push("/estudiante/bienvenida")}
                className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800"
              >
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  const { configuracion, aspectos, valoraciones } = config;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <Card className="mb-6 shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">
                    {configuracion.TITULO || configuracion.TIPO_EVALUACION_NOMBRE}
                  </CardTitle>
                  {configuracion.TIPO_EVALUACION_DESCRIPCION && (
                    <p className="text-gray-200 text-sm mt-1">
                      {configuracion.TIPO_EVALUACION_DESCRIPCION}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Información adicional si existe */}
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Instrucciones:</p>
                    <p className="mt-1">
                      {configuracion.INSTRUCCIONES || 
                        "Por favor, evalúa cada aspecto según tu experiencia. Tus respuestas son confidenciales y ayudarán a mejorar la calidad educativa."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {aspectos && aspectos.length > 0 && aspectos.map((aspecto, index) => (
              <Card key={aspecto.ID} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gray-50 border-b">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-800 text-white rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {aspecto.ETIQUETA}
                      </CardTitle>
                      {aspecto.DESCRIPCION && (
                        <p className="text-sm text-gray-600 mt-1">
                          {aspecto.DESCRIPCION}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <RadioGroup
                    value={evaluaciones[aspecto.ID] || ""}
                    onValueChange={(value) => handleRadioChange(aspecto.ID, value)}
                  >
                    <div className="space-y-3">
                      {valoraciones.map((valoracion) => (
                        <div
                          key={valoracion.ID}
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                            evaluaciones[aspecto.ID] === valoracion.VALORACION_ID.toString()
                              ? "border-gray-800 bg-gray-50"
                              : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                          }`}
                          onClick={() => handleRadioChange(aspecto.ID, valoracion.VALORACION_ID.toString())}
                        >
                          <RadioGroupItem value={valoracion.VALORACION_ID.toString()} id={`${aspecto.ID}-${valoracion.VALORACION_ID}`} />
                          <Label
                            htmlFor={`${aspecto.ID}-${valoracion.VALORACION_ID}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">
                                {valoracion.ETIQUETA}
                              </span>
                              {valoracion.DESCRIPCION && (
                                <span className="text-sm text-gray-500 ml-2">
                                  {valoracion.DESCRIPCION}
                                </span>
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  {/* Comentario opcional */}
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Comentarios adicionales (opcional)
                    </Label>
                    <Textarea
                      placeholder="Escribe aquí cualquier comentario adicional..."
                      value={comentarios[aspecto.ID] || ""}
                      onChange={(e) => handleComentarioChange(aspecto.ID, e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Preguntas genéricas */}
            {config.preguntas && config.preguntas.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                  {config.aspectos && config.aspectos.length > 0 ? 'Preguntas Adicionales' : 'Preguntas'}
                </h3>
                {config.preguntas.map((pregunta, index) => (
                  <Card key={pregunta.ID} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gray-50 border-b">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            {pregunta.TEXTO}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {(pregunta.TIPO_PREGUNTA === 'texto_corto' || pregunta.TIPO_PREGUNTA === 'texto') && (
                        <Input
                          placeholder="Tu respuesta..."
                          value={respuestas[pregunta.ID] || ""}
                          onChange={(e) => handleRespuestaChange(pregunta.ID, e.target.value)}
                          className="border rounded-md p-3 border-gray-300 focus:ring-2 focus:ring-blue-400 transition-all"
                        />
                      )}
                      {(pregunta.TIPO_PREGUNTA === 'texto_largo' || pregunta.TIPO_PREGUNTA === 'escala') && (
                        <Textarea
                          placeholder="Tu respuesta..."
                          value={respuestas[pregunta.ID] || ""}
                          onChange={(e) => handleRespuestaChange(pregunta.ID, e.target.value)}
                          className="min-h-[120px] border rounded-md p-3 border-gray-300 focus:ring-2 focus:ring-blue-400 transition-all"
                        />
                      )}
                      {pregunta.TIPO_PREGUNTA === 'opcion_multiple' && pregunta.OPCIONES && (
                        <RadioGroup
                          value={respuestas[pregunta.ID] || ""}
                          onValueChange={(value) => handleRespuestaChange(pregunta.ID, value)}
                        >
                          <div className="space-y-3">
                            {JSON.parse(pregunta.OPCIONES).map((opcion: string, idx: number) => (
                              <div
                                key={idx}
                                className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                  respuestas[pregunta.ID] === opcion
                                    ? "border-blue-600 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                }`}
                                onClick={() => handleRespuestaChange(pregunta.ID, opcion)}
                              >
                                <RadioGroupItem
                                  value={opcion}
                                  id={`pregunta-${pregunta.ID}-opcion-${idx}`}
                                />
                                <Label
                                  htmlFor={`pregunta-${pregunta.ID}-opcion-${idx}`}
                                  className="flex-1 cursor-pointer font-medium text-gray-900"
                                >
                                  {opcion}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Comentario general (opcional) */}
            <Card className="shadow-md">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Comentario General (Opcional)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Textarea
                  placeholder="Escribe aquí cualquier comentario general sobre la evaluación..."
                  value={comentarios["COMENTARIO_GENERAL"] || ""}
                  onChange={(e) => setComentarios(prev => ({
                    ...prev,
                    COMENTARIO_GENERAL: e.target.value
                  }))}
                  className="min-h-[100px]"
                />
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <Card className="shadow-md">
              <CardFooter className="flex justify-between gap-4 p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/estudiante/bienvenida")}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Enviar Evaluación
                    </div>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
