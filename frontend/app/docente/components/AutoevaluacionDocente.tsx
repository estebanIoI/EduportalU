"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { 
  ClipboardCheck, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  Info
} from "lucide-react"
import { aspectosEvaluacionService } from "@/services"
import { apiClient } from "@/services/api.client"
import { AspectoEvaluacion } from "@/lib/types/evaluacionInsitu"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

interface AutoevaluacionDocenteProps {
  documentoDocente: string
  periodo: string
  onComplete?: () => void
}

interface AutoevaluacionExistente {
  id: number
  fecha: string
  completada: boolean
  respuestas: {
    aspectoId: number
    valoracion: string
  }[]
}

// Escala de valoración simplificada para autoevaluación
const ESCALA_AUTOEVALUACION = [
  { valor: "excelente", etiqueta: "Excelente", descripcion: "Dominio completo del aspecto", puntaje: 1.0 },
  { valor: "bueno", etiqueta: "Bueno", descripcion: "Buen desempeño con áreas menores de mejora", puntaje: 0.75 },
  { valor: "aceptable", etiqueta: "Aceptable", descripcion: "Desempeño básico, requiere mejora", puntaje: 0.5 },
  { valor: "por_mejorar", etiqueta: "Por Mejorar", descripcion: "Necesita trabajo significativo", puntaje: 0.25 },
]

export function AutoevaluacionDocente({ 
  documentoDocente, 
  periodo,
  onComplete 
}: AutoevaluacionDocenteProps) {
  const { toast } = useToast()
  const [aspectos, setAspectos] = useState<AspectoEvaluacion[]>([])
  const [respuestas, setRespuestas] = useState<Record<number, string>>({})
  const [autoevaluacionExistente, setAutoevaluacionExistente] = useState<AutoevaluacionExistente | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [documentoDocente, periodo])

  const cargarDatos = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Cargar aspectos de evaluación
      const aspectosResponse = await aspectosEvaluacionService.getAll()
      if (aspectosResponse.success && aspectosResponse.data) {
        setAspectos(aspectosResponse.data)
      }

      // Verificar si ya existe una autoevaluación para este periodo
      try {
        const autoevalResponse = await apiClient.get<AutoevaluacionExistente>(
          `/evaluaciones/docente/${documentoDocente}/autoevaluacion?periodo=${periodo}`
        )
        
        if (autoevalResponse.success && autoevalResponse.data) {
          setAutoevaluacionExistente(autoevalResponse.data)
          // Cargar respuestas existentes
          if (autoevalResponse.data.respuestas) {
            const respuestasMap: Record<number, string> = {}
            autoevalResponse.data.respuestas.forEach(r => {
              respuestasMap[r.aspectoId] = r.valoracion
            })
            setRespuestas(respuestasMap)
          }
        } else {
          // No existe autoevaluación, el docente puede crearla
          setAutoevaluacionExistente(null)
        }
      } catch {
        // Error al cargar autoevaluación, permitir crearla
        setAutoevaluacionExistente(null)
      }
    } catch (err: any) {
      console.error("Error cargando datos:", err)
      setError("No se pudieron cargar los datos de autoevaluación")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRespuestaChange = (aspectoId: number, valor: string) => {
    setRespuestas(prev => ({
      ...prev,
      [aspectoId]: valor
    }))
  }

  const todasLasRespuestasCompletas = () => {
    return aspectos.every(aspecto => respuestas[aspecto.ID])
  }

  const handleSubmit = async () => {
    if (!todasLasRespuestasCompletas()) {
      toast({
        title: "Formulario incompleto",
        description: "Por favor responde todos los aspectos antes de enviar",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)

      const datosAutoevaluacion = {
        documentoDocente,
        periodo,
        respuestas: Object.entries(respuestas).map(([aspectoId, valoracion]) => ({
          aspectoId: parseInt(aspectoId),
          valoracion,
          puntaje: ESCALA_AUTOEVALUACION.find(e => e.valor === valoracion)?.puntaje || 0
        }))
      }

      const response = await apiClient.post(
        `/evaluaciones/docente/${documentoDocente}/autoevaluacion`,
        datosAutoevaluacion
      )

      if (response.success) {
        toast({
          title: "Autoevaluación enviada",
          description: "Tu autoevaluación ha sido registrada exitosamente",
        })
        
        // Recargar datos para mostrar que ya fue completada
        await cargarDatos()
        
        if (onComplete) {
          onComplete()
        }
      }
    } catch (err: any) {
      console.error("Error enviando autoevaluación:", err)
      toast({
        title: "Error",
        description: err.message || "No se pudo enviar la autoevaluación",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Cargando autoevaluación...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{error}</p>
          <Button onClick={cargarDatos} className="mt-4">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Si ya completó la autoevaluación
  if (autoevaluacionExistente?.completada) {
    return (
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-6 w-6" />
            Autoevaluación Completada
          </CardTitle>
          <CardDescription>
            Completaste tu autoevaluación el {new Date(autoevaluacionExistente.fecha).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Información</AlertTitle>
              <AlertDescription>
                La autoevaluación representa el 20% de tu nota final. El 80% restante corresponde 
                a la evaluación realizada por los estudiantes.
              </AlertDescription>
            </Alert>
            
            <div className="grid gap-3">
              {aspectos.map(aspecto => {
                const respuesta = respuestas[aspecto.ID]
                const valoracion = ESCALA_AUTOEVALUACION.find(e => e.valor === respuesta)
                
                return (
                  <div key={aspecto.ID} className="flex justify-between items-center p-3 bg-white rounded-lg border">
                    <div>
                      <span className="font-medium">{aspecto.ETIQUETA}</span>
                      <p className="text-sm text-gray-500">{aspecto.DESCRIPCION}</p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {valoracion?.etiqueta || "—"}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-blue-600" />
          Autoevaluación Docente
        </CardTitle>
        <CardDescription>
          Evalúa tu desempeño en cada uno de los siguientes aspectos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Peso de la autoevaluación</AlertTitle>
            <AlertDescription>
              Tu autoevaluación representa el <strong>20%</strong> de tu nota final. 
              El <strong>80%</strong> restante corresponde a la evaluación realizada por los estudiantes.
              Sé honesto en tus respuestas para que los resultados reflejen áreas reales de mejora.
            </AlertDescription>
          </Alert>

          {/* Formulario de autoevaluación */}
          <div className="space-y-6">
            {aspectos.map((aspecto, index) => (
              <div key={aspecto.ID} className="border rounded-lg p-4">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {index + 1}/{aspectos.length}
                    </Badge>
                    <h4 className="font-semibold text-gray-900">{aspecto.ETIQUETA}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{aspecto.DESCRIPCION}</p>
                </div>

                <RadioGroup
                  value={respuestas[aspecto.ID] || ""}
                  onValueChange={(valor) => handleRespuestaChange(aspecto.ID, valor)}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
                >
                  {ESCALA_AUTOEVALUACION.map((opcion) => (
                    <div key={opcion.valor}>
                      <RadioGroupItem
                        value={opcion.valor}
                        id={`${aspecto.ID}-${opcion.valor}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`${aspecto.ID}-${opcion.valor}`}
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-3 hover:bg-gray-50 cursor-pointer peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 transition-all"
                      >
                        <span className="font-medium text-sm">{opcion.etiqueta}</span>
                        <span className="text-xs text-gray-500 text-center mt-1">
                          {opcion.descripcion}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>

          {/* Progreso y botón de envío */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              <span className="font-medium">
                {Object.keys(respuestas).length} de {aspectos.length}
              </span>{" "}
              aspectos completados
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={!todasLasRespuestasCompletas() || isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Enviar Autoevaluación
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
