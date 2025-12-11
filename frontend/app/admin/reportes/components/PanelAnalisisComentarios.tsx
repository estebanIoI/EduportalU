"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Comentario, Docente, Materia, ResumenIA } from "@/lib/types/reportes.types"
import {
  MessageSquare,
  Search,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Quote,
  Calendar,
  BookOpen,
  Filter,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PropsPanelComentarios {
  docente?: Docente
  materia?: Materia
  comentarios?: Comentario[]
  resumenIA?: ResumenIA | null
  titulo?: string
  mostrarFiltros?: boolean
}

// Clasificar comentario por sentimiento basado en palabras clave
function clasificarSentimiento(texto: string): "positivo" | "negativo" | "neutro" {
  const textLower = texto.toLowerCase()
  
  const palabrasPositivas = [
    "excelente", "muy bien", "muy bueno", "genial", "fantástico", "increíble",
    "gran", "buen", "buena", "bueno", "me gusta", "recomiendo", "claro",
    "didáctico", "profesional", "paciente", "atento", "puntual", "organizado",
    "comprometido", "domina", "explica bien", "motivador", "dinámico"
  ]
  
  const palabrasNegativas = [
    "malo", "mala", "terrible", "pésimo", "deficiente", "no explica",
    "confuso", "aburrido", "desorganizado", "impuntual", "no entiende",
    "difícil", "complicado", "mejorar", "falta", "problema", "no responde",
    "tardío", "incoherente", "desinterés"
  ]
  
  let puntuacionPositiva = 0
  let puntuacionNegativa = 0
  
  palabrasPositivas.forEach(palabra => {
    if (textLower.includes(palabra)) puntuacionPositiva++
  })
  
  palabrasNegativas.forEach(palabra => {
    if (textLower.includes(palabra)) puntuacionNegativa++
  })
  
  if (puntuacionPositiva > puntuacionNegativa) return "positivo"
  if (puntuacionNegativa > puntuacionPositiva) return "negativo"
  return "neutro"
}

// Componente para un comentario individual
function ComentarioItem({ 
  comentario, 
  mostrarMateria = false,
  sentimiento 
}: { 
  comentario: Comentario
  mostrarMateria?: boolean
  sentimiento?: "positivo" | "negativo" | "neutro"
}) {
  const sentimentoCalculado = sentimiento || clasificarSentimiento(comentario.texto)
  
  const getIconoSentimiento = () => {
    switch (sentimentoCalculado) {
      case "positivo":
        return <ThumbsUp className="h-4 w-4 text-green-500" />
      case "negativo":
        return <ThumbsDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }
  
  const getBgSentimiento = () => {
    switch (sentimentoCalculado) {
      case "positivo":
        return "border-l-green-500 bg-green-50/50 dark:bg-green-950/20"
      case "negativo":
        return "border-l-red-500 bg-red-50/50 dark:bg-red-950/20"
      default:
        return "border-l-gray-400 bg-gray-50/50 dark:bg-gray-950/20"
    }
  }

  return (
    <div className={cn(
      "p-4 rounded-lg border-l-4 transition-colors",
      getBgSentimiento()
    )}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getIconoSentimiento()}</div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground italic leading-relaxed">
            <Quote className="h-3 w-3 inline-block mr-1 opacity-50" />
            {comentario.texto}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {comentario.fecha && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(comentario.fecha).toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                })}
              </span>
            )}
            {mostrarMateria && comentario.aspecto && (
              <Badge variant="outline" className="text-xs">
                {comentario.aspecto}
              </Badge>
            )}
            {comentario.valoracion && (
              <Badge variant="secondary" className="text-xs">
                {comentario.valoracion}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para estadísticas de sentimiento
function EstadisticasSentimiento({ comentarios }: { comentarios: Comentario[] }) {
  const stats = useMemo(() => {
    const clasificados = comentarios.map(c => ({
      ...c,
      sentimiento: clasificarSentimiento(c.texto)
    }))
    
    return {
      positivos: clasificados.filter(c => c.sentimiento === "positivo").length,
      negativos: clasificados.filter(c => c.sentimiento === "negativo").length,
      neutros: clasificados.filter(c => c.sentimiento === "neutro").length,
      total: clasificados.length
    }
  }, [comentarios])
  
  const porcentajePositivos = stats.total > 0 
    ? ((stats.positivos / stats.total) * 100).toFixed(1) 
    : "0"

  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <CardContent className="p-4 text-center">
          <ThumbsUp className="h-6 w-6 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold text-green-600">{stats.positivos}</p>
          <p className="text-xs text-muted-foreground">Positivos</p>
        </CardContent>
      </Card>
      <Card className="bg-gray-50/50 dark:bg-gray-950/20">
        <CardContent className="p-4 text-center">
          <Minus className="h-6 w-6 mx-auto text-gray-500 mb-2" />
          <p className="text-2xl font-bold">{stats.neutros}</p>
          <p className="text-xs text-muted-foreground">Neutros</p>
        </CardContent>
      </Card>
      <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
        <CardContent className="p-4 text-center">
          <ThumbsDown className="h-6 w-6 mx-auto text-red-500 mb-2" />
          <p className="text-2xl font-bold text-red-600">{stats.negativos}</p>
          <p className="text-xs text-muted-foreground">Negativos</p>
        </CardContent>
      </Card>
    </div>
  )
}

// Panel principal de análisis de comentarios
export function PanelAnalisisComentarios({
  docente,
  materia,
  comentarios: comentariosDirectos,
  resumenIA,
  titulo = "Análisis de Comentarios",
  mostrarFiltros = true,
}: PropsPanelComentarios) {
  const [busqueda, setBusqueda] = useState("")
  const [filtroSentimiento, setFiltroSentimiento] = useState<"todos" | "positivo" | "negativo" | "neutro">("todos")
  const [mostrarTodos, setMostrarTodos] = useState(false)

  // Obtener comentarios desde diferentes fuentes
  let comentarios: Comentario[] = []

  if (comentariosDirectos) {
    comentarios = comentariosDirectos
  } else if (materia) {
    comentarios = materia.observaciones_crudas || materia.observaciones || []
  } else if (docente) {
    // Consolidar comentarios de todas las materias
    docente.materias.forEach((mat) => {
      const obs = mat.observaciones_crudas || mat.observaciones || []
      obs.forEach((o) => {
        comentarios.push({
          ...o,
          aspecto: mat.nombre, // Agregar nombre de materia como referencia
        })
      })
    })
  }

  // Filtrar comentarios
  const comentariosFiltrados = useMemo(() => {
    return comentarios.filter(c => {
      // Filtro de búsqueda
      if (busqueda && !c.texto.toLowerCase().includes(busqueda.toLowerCase())) {
        return false
      }
      
      // Filtro de sentimiento
      if (filtroSentimiento !== "todos") {
        const sentimiento = clasificarSentimiento(c.texto)
        if (sentimiento !== filtroSentimiento) return false
      }
      
      return true
    })
  }, [comentarios, busqueda, filtroSentimiento])

  // Limitar cantidad mostrada si no está expandido
  const comentariosMostrados = mostrarTodos 
    ? comentariosFiltrados 
    : comentariosFiltrados.slice(0, 5)

  if (comentarios.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {titulo}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No hay comentarios disponibles para analizar</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {titulo}
            </CardTitle>
            <CardDescription>
              {comentarios.length} comentarios recopilados
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="comentarios">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comentarios">Todos los Comentarios</TabsTrigger>
            <TabsTrigger value="analisis">
              <Sparkles className="h-4 w-4 mr-1" />
              Análisis
            </TabsTrigger>
          </TabsList>

          {/* Tab de comentarios */}
          <TabsContent value="comentarios" className="mt-4 space-y-4">
            {/* Estadísticas de sentimiento */}
            <EstadisticasSentimiento comentarios={comentarios} />

            {/* Filtros */}
            {mostrarFiltros && (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar en comentarios..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filtroSentimiento === "todos" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltroSentimiento("todos")}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filtroSentimiento === "positivo" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltroSentimiento("positivo")}
                    className={filtroSentimiento === "positivo" ? "bg-green-500 hover:bg-green-600" : ""}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={filtroSentimiento === "negativo" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltroSentimiento("negativo")}
                    className={filtroSentimiento === "negativo" ? "bg-red-500 hover:bg-red-600" : ""}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de comentarios */}
            <ScrollArea className={mostrarTodos ? "h-[500px]" : ""}>
              <div className="space-y-3">
                {comentariosMostrados.map((comentario, idx) => (
                  <ComentarioItem
                    key={idx}
                    comentario={comentario}
                    mostrarMateria={!!docente}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Botón para ver más */}
            {comentariosFiltrados.length > 5 && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setMostrarTodos(!mostrarTodos)}
              >
                {mostrarTodos ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Ver {comentariosFiltrados.length - 5} comentarios más
                  </>
                )}
              </Button>
            )}

            {comentariosFiltrados.length === 0 && busqueda && (
              <div className="text-center py-6 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No se encontraron comentarios que coincidan con la búsqueda</p>
              </div>
            )}
          </TabsContent>

          {/* Tab de análisis con IA */}
          <TabsContent value="analisis" className="mt-4">
            {resumenIA ? (
              <div className="space-y-6">
                {/* Resumen ejecutivo */}
                {resumenIA.resumen_ejecutivo && (
                  <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        Resumen Ejecutivo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{resumenIA.resumen_ejecutivo}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fortalezas */}
                  {resumenIA.fortalezas && resumenIA.fortalezas.length > 0 && (
                    <Card className="border-green-200 dark:border-green-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                          <ThumbsUp className="h-4 w-4" />
                          Fortalezas Identificadas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {resumenIA.fortalezas.map((fortaleza, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-green-500 mt-1">✓</span>
                              <span>{fortaleza}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Áreas de mejora */}
                  {resumenIA.aspectos_mejora && resumenIA.aspectos_mejora.length > 0 && (
                    <Card className="border-orange-200 dark:border-orange-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
                          <ThumbsDown className="h-4 w-4" />
                          Áreas de Mejora
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {resumenIA.aspectos_mejora.map((area, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-orange-500 mt-1">→</span>
                              <span>{area}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Frases representativas */}
                {resumenIA.frases_representativas && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Quote className="h-4 w-4" />
                        Frases Representativas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {Array.isArray(resumenIA.frases_representativas) ? (
                        <div className="space-y-2">
                          {(resumenIA.frases_representativas as string[]).map((frase, idx) => (
                            <p key={idx} className="text-sm italic text-muted-foreground border-l-2 pl-3">
                              &ldquo;{frase}&rdquo;
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {resumenIA.frases_representativas.positivas?.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-green-600 mb-2">Positivas</h5>
                              <div className="space-y-2">
                                {resumenIA.frases_representativas.positivas.map((frase, idx) => (
                                  <p key={idx} className="text-sm italic text-muted-foreground border-l-2 border-green-500 pl-3">
                                    &ldquo;{frase}&rdquo;
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                          {resumenIA.frases_representativas.negativas?.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-red-600 mb-2">A mejorar</h5>
                              <div className="space-y-2">
                                {resumenIA.frases_representativas.negativas.map((frase, idx) => (
                                  <p key={idx} className="text-sm italic text-muted-foreground border-l-2 border-red-500 pl-3">
                                    &ldquo;{frase}&rdquo;
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Información del procesamiento */}
                {resumenIA.procesado_con_ia && (
                  <div className="text-xs text-muted-foreground text-center">
                    <Sparkles className="h-3 w-3 inline-block mr-1" />
                    Análisis generado con IA
                    {resumenIA.modelo_usado && ` (${resumenIA.modelo_usado})`}
                    {resumenIA.fecha_generacion && ` - ${new Date(resumenIA.fecha_generacion).toLocaleDateString("es-CO")}`}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay análisis de IA disponible</p>
                <p className="text-xs mt-2">
                  Active la opción "Análisis IA" al generar el reporte para obtener un análisis detallado
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Exports
export { ComentarioItem, EstadisticasSentimiento, clasificarSentimiento }
