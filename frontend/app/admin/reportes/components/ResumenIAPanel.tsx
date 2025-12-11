"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ResumenIA, Docente } from "@/lib/types/reportes.types"
import { reportesService } from "@/services/reportes/reportes.service"
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquareQuote,
  Brain,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  docente: Docente
  materia?: string
  resumenExistente?: ResumenIA | null
  onResumenGenerado?: (resumen: ResumenIA) => void
}

export function ResumenIAPanel({ docente, materia, resumenExistente, onResumenGenerado }: Props) {
  const [resumen, setResumen] = useState<ResumenIA | null>(resumenExistente || null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [iaStatus, setIaStatus] = useState<"unknown" | "online" | "offline">("unknown")

  // Verificar estado de IA
  const verificarIA = async () => {
    try {
      const response = await reportesService.getIAStatus()
      const isOnline = response.data?.ollama_available || false
      setIaStatus(isOnline ? "online" : "offline")
      return isOnline
    } catch {
      setIaStatus("offline")
      return false
    }
  }

  // Generar resumen
  const generarResumen = async () => {
    setError(null)
    setCargando(true)

    try {
      // Verificar primero si IA está disponible
      const iaDisponible = await verificarIA()
      if (!iaDisponible) {
        setError("El servicio de IA no está disponible en este momento. Intente más tarde.")
        return
      }

      // Obtener comentarios del docente para la materia
      const comentarios = materia 
        ? docente.materias.find(m => m.nombre === materia)?.observaciones_crudas?.map(o => o.texto) || []
        : docente.materias.flatMap(m => m.observaciones_crudas?.map(o => o.texto) || [])

      if (comentarios.length === 0) {
        setError("No hay comentarios disponibles para analizar")
        return
      }

      // Generar resumen
      const response = await reportesService.generarResumenIA({
        comentarios,
        tipo: 'fortalezas_mejora'
      })

      const nuevoResumen: ResumenIA = {
        fortalezas: response.data?.fortalezas || [],
        aspectos_mejora: response.data?.aspectos_mejora || [],
        frases_representativas: response.data?.frases_representativas || [],
        resumen_ejecutivo: response.data?.resumen_ejecutivo || "",
        procesado_con_ia: response.data?.procesado_con_ia,
        fecha_generacion: new Date().toISOString(),
      }

      setResumen(nuevoResumen)
      onResumenGenerado?.(nuevoResumen)
    } catch (err: any) {
      setError(err.message || "Error al generar el resumen con IA")
    } finally {
      setCargando(false)
    }
  }

  // Si está cargando
  if (cargando) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500 animate-pulse" />
            Generando Resumen con IA...
          </CardTitle>
          <CardDescription>
            Analizando comentarios de {docente.nombre}
            {materia && ` en ${materia}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Procesando comentarios y generando análisis...
            </span>
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  // Si hay error
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Resumen Generado con IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button className="mt-4" variant="outline" onClick={generarResumen}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Si no hay resumen, mostrar botón para generar
  if (!resumen) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Análisis con Inteligencia Artificial
          </CardTitle>
          <CardDescription>
            Genera un resumen automático de los comentarios de evaluación usando IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-6">
            <Brain className="h-16 w-16 text-muted-foreground/50" />
            <p className="text-center text-muted-foreground max-w-md">
              Nuestro modelo de IA analizará los comentarios de los estudiantes para
              identificar fortalezas, áreas de mejora y frases representativas.
            </p>
            <Button onClick={generarResumen} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generar Resumen con IA
            </Button>
            {iaStatus === "offline" && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                El servicio de IA no está disponible
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Mostrar resumen existente
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Resumen Generado con IA
            </CardTitle>
            <CardDescription>
              Análisis de {docente.nombre}
              {materia && ` - ${materia}`}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={generarResumen}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Regenerar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fortalezas */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2 text-green-700 dark:text-green-400">
            <ThumbsUp className="h-4 w-4" />
            Fortalezas Identificadas
          </h4>
          <div className="pl-6 space-y-2">
            {resumen.fortalezas.length > 0 ? (
              resumen.fortalezas.map((fortaleza, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{fortaleza}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No se identificaron fortalezas específicas
              </p>
            )}
          </div>
        </div>

        {/* Áreas de Mejora */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <ThumbsDown className="h-4 w-4" />
            Áreas de Mejora
          </h4>
          <div className="pl-6 space-y-2">
            {resumen.aspectos_mejora.length > 0 ? (
              resumen.aspectos_mejora.map((mejora, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm"
                >
                  <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                  <span>{mejora}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No se identificaron áreas de mejora específicas
              </p>
            )}
          </div>
        </div>

        {/* Frases Representativas */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <MessageSquareQuote className="h-4 w-4" />
            Frases Representativas
          </h4>
          <div className="pl-6 space-y-3">
            {(() => {
              // Manejar frases como array o como objeto FrasesRepresentativas
              const frases = resumen.frases_representativas
              const frasesArray: string[] = Array.isArray(frases) 
                ? frases 
                : [...(frases?.positivas || []), ...(frases?.negativas || [])]
              
              return frasesArray.length > 0 ? (
                frasesArray.map((frase: string, index: number) => (
                  <blockquote
                    key={index}
                    className="border-l-2 border-blue-300 dark:border-blue-700 pl-4 italic text-sm text-muted-foreground"
                  >
                    &ldquo;{frase}&rdquo;
                  </blockquote>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No hay frases representativas disponibles
                </p>
              )
            })()}
          </div>
        </div>

        {/* Metadata */}
        {resumen.fecha_generacion && (
          <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Generado: {new Date(resumen.fecha_generacion).toLocaleString("es-CO")}
            </span>
            {resumen.modelo && (
              <Badge variant="outline" className="text-xs">
                {resumen.modelo}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Panel compacto para mostrar múltiples resúmenes
interface PropsMultiple {
  resumenes: { materia: string; resumen: ResumenIA }[]
}

export function ResumenesIAGrid({ resumenes }: PropsMultiple) {
  if (!resumenes || resumenes.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {resumenes.map(({ materia, resumen }) => (
        <Card key={materia} className="overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              {materia}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Fortalezas compactas */}
            {resumen.fortalezas.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                  Fortalezas:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {resumen.fortalezas.slice(0, 3).map((f, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mejoras compactas */}
            {resumen.aspectos_mejora.length > 0 && (
              <div>
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">
                  Áreas de mejora:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {resumen.aspectos_mejora.slice(0, 2).map((m, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <AlertCircle className="h-3 w-3 text-orange-500 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
