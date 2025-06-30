"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { tiposEvaluacionService } from "@/services";
import { evaluacionesDetalleService } from "@/services";
import { ModalConfirmacionEvaluacion } from "@/app/estudiante/components/ModalConfirmacionEvaluacion";

import type {
  ConfiguracionResponse,
} from "@/lib/types/evaluacionInsitu";

export default function EvaluarDocentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [evaluaciones, setEvaluaciones] = useState<Record<number, string>>({});
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [config, setConfig] = useState<ConfiguracionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [openAspecto, setOpenAspecto] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Desenrolla params usando React.use()
  const unwrappedParams = React.use(params);
  const id = Number(unwrappedParams.id);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await tiposEvaluacionService.getConfiguracion(id);
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

    // Verificar que todos los aspectos tengan evaluación
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

    // Mostrar modal de confirmación
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
  if (!config) return;

  // Construir el payload para el bulk
  const bulkPayload = {
    evaluacionId: Number(evaluationData.id_evaluacion), 
    comentarioGeneral: comentarios["COMENTARIO_GENERAL"] || "",
    detalles: config.aspectos.map((aspecto) => ({
      aspectoId: aspecto.ID,
      valoracionId: Number(evaluaciones[aspecto.ID]),
      comentario: comentarios[aspecto.ID] || "",
    })),
  };

  console.log("Payload a enviar:", bulkPayload);
  
  try {
    await evaluacionesDetalleService.createBulk(bulkPayload);
    
    // Usar el ID de configuración para redirigir al dashboard correcto
    router.push(`/estudiante/dashboard/${id}`);
    console.log("Evaluación enviada exitosamente para el ID:", id);
    // Opcional: mostrar toast de éxito
    toast({
      title: "Evaluación enviada",
      description: "Tu evaluación ha sido enviada exitosamente.",
    });
  } catch (error) {
    // Manejar errores
    toast({
      title: "Error",
      description: "Hubo un problema al enviar la evaluación. Inténtalo de nuevo.",
      variant: "destructive",
    });
  }
};

  const handleCloseModal = () => {
    setShowConfirmModal(false);
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

  if (loading) {
    return <div className="p-8 text-center">Cargando configuración...</div>;
  }

  if (!config) {
    return (
      <div className="p-8 text-center text-red-600">
        No se encontró la configuración.
      </div>
    );
  }

  const evaluationData = {
    id_evaluacion: searchParams.get("id") || "",
    programa: searchParams.get("programa") || "",
    nombreDocente: searchParams.get("docente") || "",
    asignatura: searchParams.get("materia") || "",
    semestre: searchParams.get("semestre") || "",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="container mx-auto max-w-2xl md:max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg sm:text-2xl">Evaluación {config.configuracion?.NOMBRE}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Card className="mb-6 bg-white shadow-xl rounded-lg overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-6">
                    {/* Datos de la asignatura y semestre */}
                    <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                      <h3 className="text-xl sm:text-3xl font-semibold text-gray-900 break-words">
                        {evaluationData.asignatura}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2">
                        <p className="text-base sm:text-lg font-medium text-gray-500">
                          {evaluationData.semestre
                            .toLowerCase()
                            .replace(/(\d+)\s*semestre/, (_, num) => `${num} Semestre`)}
                        </p>
                        <span className="hidden sm:inline-block text-gray-300">|</span>
                        <p className="text-base sm:text-lg font-medium text-gray-500">
                          {evaluationData.programa}
                        </p>
                      </div>
                    </div>
                    {/* Docente */}
                    <div className="flex flex-col items-center md:items-end gap-2 mt-4 md:mt-0">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-7 w-7 sm:h-9 sm:w-9 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div className="text-center md:text-right">
                        <p className="text-xs sm:text-sm font-medium text-gray-500">Docente</p>
                        <p className="text-base sm:text-xl font-semibold text-gray-900 break-words">
                          {evaluationData.nombreDocente}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="mb-8">
                <div className="hidden md:grid grid-cols-3 gap-8 text-center font-semibold text-gray-700 mb-8">
                  <div>Aspecto a evaluar</div>
                  <div>Clasificación</div>
                </div>
                <div className="hidden md:grid grid-cols-3 gap-8 text-center text-sm text-gray-500 mb-8">
                  <div></div>
                  <div className="flex gap-6 justify-center">
                    {config.valoraciones.map((valoracion) => (
                      <span key={valoracion.ID} className="text-gray-600">
                        {valoracion.ETIQUETA}
                      </span>
                    ))}
                  </div>
                  <div></div>
                </div>
                {/* Responsive: encabezados para móvil */}
                <div className="md:hidden mb-4">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>Aspecto</span>
                    <span>Clasificación</span>
                  </div>
                </div>
                {config.aspectos.map((aspecto) => (
                  <div
                    key={aspecto.ID}
                    className="mb-4 rounded-lg border border-gray-200 shadow bg-white transition-all"
                  >
                    <button
                      type="button"
                      className="w-full flex justify-between items-center p-3 sm:p-4 focus:outline-none hover:bg-gray-50 transition"
                      onClick={() =>
                        setOpenAspecto(openAspecto === aspecto.ID ? null : aspecto.ID)
                      }
                    >
                      <span className="text-base sm:text-lg font-semibold text-gray-800">
                        {aspecto.ETIQUETA}
                      </span>
                      <span className="ml-2">
                        {openAspecto === aspecto.ID ? (
                          <svg
                            className="w-5 h-5 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        )}
                      </span>
                    </button>
                    {openAspecto === aspecto.ID && (
                      <div className="p-3 sm:p-4 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-4">
                          <RadioGroup
                            value={evaluaciones[aspecto.ID] || ""}
                            onValueChange={(value) =>
                              handleRadioChange(aspecto.ID, value)
                            }
                            className="flex gap-4 sm:gap-6 justify-center"
                          >
                            {config.valoraciones.map((valoracion) => (
                              <div
                                key={valoracion.ID}
                                className="flex flex-col items-center"
                              >
                                <RadioGroupItem
                                  value={valoracion.ID.toString()}
                                  id={`${aspecto.ID}-${valoracion.ID}`}
                                  className="h-7 w-7 rounded-full border-gray-300 hover:bg-blue-100 transition-all"
                                />
                                <span className="mt-1 text-xs sm:text-base">
                                  {valoracion.VALOR}
                                </span>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                        <div className="mb-1 text-xs sm:text-sm font-medium text-gray-700">Comentario:</div>
                        <Textarea
                          placeholder="Escribe tus comentarios aquí..."
                          value={comentarios[aspecto.ID] || ""}
                          onChange={(e) =>
                            handleComentarioChange(aspecto.ID, e.target.value)
                          }
                          className="h-20 sm:h-24 border rounded-md p-3 sm:p-4 border-gray-300 focus:ring-2 focus:ring-blue-400 transition-all"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Comentario general expandible */}
              <div className="mb-4 rounded-lg border border-gray-200 shadow bg-white transition-all">
                <button
                  type="button"
                  className="w-full flex justify-between items-center p-3 sm:p-4 focus:outline-none hover:bg-gray-50 transition"
                  onClick={() => setOpenAspecto(openAspecto === -1 ? null : -1)}
                >
                  <span className="text-base sm:text-lg font-semibold text-gray-800">
                    Comentario general (opcional)
                  </span>
                  <span className="ml-2">
                    {openAspecto === -1 ? (
                      <svg
                        className="w-5 h-5 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </span>
                </button>
                {openAspecto === -1 && (
                  <div className="p-3 sm:p-4 border-t border-gray-100">
                    <Textarea
                      id="COMENTARIO_GENERAL"
                      placeholder="Escribe aquí un comentario general sobre el docente o la asignatura..."
                      onChange={(e) =>
                        handleComentarioChange(
                          "COMENTARIO_GENERAL" as any,
                          e.target.value
                        )
                      }
                      className="h-20 sm:h-28 border rounded-md p-3 sm:p-4 border-gray-300 focus:ring-2 focus:ring-blue-400 transition-all"
                    />
                  </div>
                )}
              </div>
              <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/estudiante/dashboard/${id}`)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? "Enviando..." : "Enviar Evaluación"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>

        {/* Modal de Confirmación */}
        <ModalConfirmacionEvaluacion
          isOpen={showConfirmModal}
          onClose={handleCloseModal}
          onConfirm={handleConfirmSubmit}
          title="¿Confirmar evaluación?"
          description={`Estás a punto de enviar tu evaluación para ${evaluationData.asignatura} del docente ${evaluationData.nombreDocente}.`}
        />
      </div>
    </div>
  );
}