"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Aspecto, Docente, Materia, DistribucionValoracion } from "@/lib/types/reportes.types"
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Star,
  Target,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PropsAspectoCard {
  aspecto: Aspecto
  mostrarComentarios?: boolean
}

interface PropsPanelAspectos {
  docente?: Docente
  materia?: Materia
  aspectos?: Aspecto[]
  titulo?: string
  mostrarDistribucion?: boolean
  mostrarComentarios?: boolean
}

// Componente para mostrar la distribución de valoraciones
function DistribucionValoraciones({ distribucion }: { distribucion: DistribucionValoracion }) {
  const total = distribucion.E + distribucion.B + distribucion.A + distribucion.D
  
  if (total === 0) return null

  const porcentajes = {
    E: ((distribucion.E / total) * 100).toFixed(1),
    B: ((distribucion.B / total) * 100).toFixed(1),
    A: ((distribucion.A / total) * 100).toFixed(1),
    D: ((distribucion.D / total) * 100).toFixed(1),
  }

  const items = [
    { key: "E", label: "Excelente", valor: distribucion.E, porcentaje: porcentajes.E, colorClass: "[&>div]:bg-green-500" },
    { key: "B", label: "Bueno", valor: distribucion.B, porcentaje: porcentajes.B, colorClass: "[&>div]:bg-blue-500" },
    { key: "A", label: "Aceptable", valor: distribucion.A, porcentaje: porcentajes.A, colorClass: "[&>div]:bg-yellow-500" },
    { key: "D", label: "Deficiente", valor: distribucion.D, porcentaje: porcentajes.D, colorClass: "[&>div]:bg-red-500" },
  ]

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-2">
          <span className="text-xs w-20 text-muted-foreground">{item.label}</span>
          <div className="flex-1">
            <Progress 
              value={parseFloat(item.porcentaje)} 
              className={cn("h-2", item.colorClass)} 
            />
          </div>
          <span className="text-xs w-12 text-right font-medium">{item.valor}</span>
          <span className="text-xs w-12 text-right text-muted-foreground">({item.porcentaje}%)</span>
        </div>
      ))}
    </div>
  )
}

// Componente para un aspecto individual con detalle
function AspectoCard({ aspecto, mostrarComentarios = true }: PropsAspectoCard) {
  const [expandido, setExpandido] = useState(false)

  // Determinar color y estado según el promedio
  const getColorPromedio = (promedio: number) => {
    if (promedio >= 4.5) return "text-green-600 dark:text-green-400"
    if (promedio >= 4.0) return "text-blue-600 dark:text-blue-400"
    if (promedio >= 3.5) return "text-yellow-600 dark:text-yellow-400"
    if (promedio >= 3.0) return "text-orange-600 dark:text-orange-400"
    return "text-red-600 dark:text-red-400"
  }

  const getBgPromedio = (promedio: number) => {
    if (promedio >= 4.5) return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
    if (promedio >= 4.0) return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
    if (promedio >= 3.5) return "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"
    if (promedio >= 3.0) return "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800"
    return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
  }

  const getIcono = (promedio: number) => {
    if (promedio >= 4.0) return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (promedio >= 3.0) return <TrendingUp className="h-4 w-4 text-yellow-500" />
    return <AlertTriangle className="h-4 w-4 text-red-500" />
  }

  const tieneComentarios = aspecto.comentarios && aspecto.comentarios.length > 0

  return (
    <Card className={cn("transition-all duration-200", getBgPromedio(aspecto.promedio))}>
      <CardHeader 
        className="pb-2 cursor-pointer" 
        onClick={() => tieneComentarios && setExpandido(!expandido)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getIcono(aspecto.promedio)}
            <div>
              <CardTitle className="text-sm font-medium">{aspecto.nombre}</CardTitle>
              <CardDescription className="text-xs">
                {aspecto.total_respuestas} respuestas
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn("font-bold text-lg px-3 py-1", getColorPromedio(aspecto.promedio))}
            >
              {aspecto.promedio.toFixed(2)}
            </Badge>
            {tieneComentarios && mostrarComentarios && (
              <ChevronRight 
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  expandido && "rotate-90"
                )} 
              />
            )}
          </div>
        </div>
      </CardHeader>

      {/* Distribución de valoraciones */}
      {aspecto.distribucion && (
        <CardContent className="pt-0 pb-3">
          <DistribucionValoraciones distribucion={aspecto.distribucion} />
        </CardContent>
      )}

      {/* Comentarios expandibles */}
      {expandido && tieneComentarios && mostrarComentarios && (
        <CardContent className="pt-0">
          <Separator className="mb-3" />
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Comentarios ({aspecto.comentarios.length})
            </h5>
            <ScrollArea className="max-h-40">
              <div className="space-y-2">
                {aspecto.comentarios.map((comentario, idx) => (
                  <div 
                    key={idx} 
                    className="p-2 bg-background rounded border text-xs"
                  >
                    <p className="text-muted-foreground italic">&ldquo;{comentario.texto}&rdquo;</p>
                    {comentario.valoracion && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {comentario.valoracion}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Componente para mostrar resumen de fortalezas y áreas de mejora
function ResumenAspectos({ aspectos }: { aspectos: Aspecto[] }) {
  const aspectosOrdenados = [...aspectos].sort((a, b) => b.promedio - a.promedio)
  const fortalezas = aspectosOrdenados.filter(a => a.promedio >= 4.0).slice(0, 3)
  const mejora = aspectosOrdenados.filter(a => a.promedio < 4.0).sort((a, b) => a.promedio - b.promedio).slice(0, 3)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Fortalezas */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-green-600">
            <Star className="h-4 w-4" />
            Fortalezas Destacadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fortalezas.length > 0 ? (
            <div className="space-y-2">
              {fortalezas.map((aspecto, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded">
                  <span className="text-sm">{aspecto.nombre}</span>
                  <Badge className="bg-green-500">{aspecto.promedio.toFixed(2)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin fortalezas destacadas</p>
          )}
        </CardContent>
      </Card>

      {/* Áreas de mejora */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
            <Target className="h-4 w-4" />
            Áreas de Mejora
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mejora.length > 0 ? (
            <div className="space-y-2">
              {mejora.map((aspecto, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950/30 rounded">
                  <span className="text-sm">{aspecto.nombre}</span>
                  <Badge variant="outline" className="border-orange-500 text-orange-600">
                    {aspecto.promedio.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin áreas de mejora identificadas</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Componente principal del panel de aspectos evaluados
export function PanelAspectosEvaluados({
  docente,
  materia,
  aspectos: aspectosDirectos,
  titulo = "Aspectos Evaluados",
  mostrarDistribucion = true,
  mostrarComentarios = true,
}: PropsPanelAspectos) {
  // Obtener aspectos desde diferentes fuentes
  let aspectos: Aspecto[] = []

  if (aspectosDirectos) {
    aspectos = aspectosDirectos
  } else if (materia) {
    aspectos = materia.aspectos || []
  } else if (docente) {
    // Consolidar aspectos de todas las materias del docente
    const aspectosMap = new Map<string, { 
      suma: number
      count: number
      distribucion: DistribucionValoracion
      comentarios: typeof aspectos[0]["comentarios"]
    }>()

    docente.materias.forEach((mat) => {
      mat.aspectos?.forEach((asp) => {
        const existing = aspectosMap.get(asp.nombre)
        if (existing) {
          aspectosMap.set(asp.nombre, {
            suma: existing.suma + asp.promedio,
            count: existing.count + 1,
            distribucion: {
              E: existing.distribucion.E + (asp.distribucion?.E || 0),
              B: existing.distribucion.B + (asp.distribucion?.B || 0),
              A: existing.distribucion.A + (asp.distribucion?.A || 0),
              D: existing.distribucion.D + (asp.distribucion?.D || 0),
            },
            comentarios: [...(existing.comentarios || []), ...(asp.comentarios || [])],
          })
        } else {
          aspectosMap.set(asp.nombre, {
            suma: asp.promedio,
            count: 1,
            distribucion: asp.distribucion || { E: 0, B: 0, A: 0, D: 0 },
            comentarios: asp.comentarios || [],
          })
        }
      })
    })

    aspectos = Array.from(aspectosMap.entries()).map(([nombre, data], idx) => ({
      id: idx,
      nombre,
      promedio: data.suma / data.count,
      total_respuestas: data.distribucion.E + data.distribucion.B + data.distribucion.A + data.distribucion.D,
      distribucion: data.distribucion,
      comentarios: data.comentarios,
    }))
  }

  if (aspectos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {titulo}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No hay datos de aspectos evaluados disponibles</p>
        </CardContent>
      </Card>
    )
  }

  // Calcular promedio general
  const promedioGeneral = aspectos.reduce((sum, a) => sum + a.promedio, 0) / aspectos.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {titulo}
            </CardTitle>
            <CardDescription>
              {aspectos.length} aspectos evaluados • Promedio general: {promedioGeneral.toFixed(2)}
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "text-lg font-bold px-4 py-2",
              promedioGeneral >= 4.0 ? "border-green-500 text-green-600" : 
              promedioGeneral >= 3.5 ? "border-yellow-500 text-yellow-600" : 
              "border-red-500 text-red-600"
            )}
          >
            {promedioGeneral.toFixed(2)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="resumen">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="detalle">Detalle por Aspecto</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="mt-4">
            <ResumenAspectos aspectos={aspectos} />
          </TabsContent>

          <TabsContent value="detalle" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {aspectos
                  .sort((a, b) => b.promedio - a.promedio)
                  .map((aspecto) => (
                    <AspectoCard 
                      key={aspecto.id || aspecto.nombre} 
                      aspecto={aspecto}
                      mostrarComentarios={mostrarComentarios}
                    />
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Export adicional para usar en otros componentes
export { AspectoCard, ResumenAspectos, DistribucionValoraciones }
