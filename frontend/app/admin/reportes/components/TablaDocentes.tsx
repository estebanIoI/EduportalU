"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Docente } from "@/lib/types/reportes.types"
import { Eye, Search, ArrowUpDown, MessageSquare } from "lucide-react"

interface Props {
  docentes: Docente[]
  onVerDetalle: (docente: Docente) => void
  titulo?: string
}

type SortField = "nombre" | "programa" | "promedio" | "comentarios"
type SortOrder = "asc" | "desc"

export function TablaDocentes({ docentes, onVerDetalle, titulo = "Listado de Docentes" }: Props) {
  const [busqueda, setBusqueda] = useState("")
  const [sortField, setSortField] = useState<SortField>("promedio")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [paginaActual, setPaginaActual] = useState(1)
  const itemsPorPagina = 10

  // Filtrar y ordenar docentes
  const docentesFiltrados = useMemo(() => {
    let resultado = [...docentes]

    // Filtrar por búsqueda
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      resultado = resultado.filter(
        (d) =>
          d.nombre.toLowerCase().includes(termino) ||
          d.documento.includes(termino) ||
          d.programa?.toLowerCase().includes(termino)
      )
    }

    // Ordenar
    resultado.sort((a, b) => {
      let valorA: any
      let valorB: any

      switch (sortField) {
        case "nombre":
          valorA = a.nombre.toLowerCase()
          valorB = b.nombre.toLowerCase()
          break
        case "programa":
          valorA = (a.programa || "").toLowerCase()
          valorB = (b.programa || "").toLowerCase()
          break
        case "promedio":
          valorA = a.promedio_general
          valorB = b.promedio_general
          break
        case "comentarios":
          valorA = a.total_comentarios || 0
          valorB = b.total_comentarios || 0
          break
        default:
          return 0
      }

      if (valorA < valorB) return sortOrder === "asc" ? -1 : 1
      if (valorA > valorB) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return resultado
  }, [docentes, busqueda, sortField, sortOrder])

  // Paginación
  const totalPaginas = Math.ceil(docentesFiltrados.length / itemsPorPagina)
  const docentesPaginados = docentesFiltrados.slice(
    (paginaActual - 1) * itemsPorPagina,
    paginaActual * itemsPorPagina
  )

  // Toggle ordenamiento
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  // Obtener color del badge según promedio
  const getBadgeVariant = (promedio: number) => {
    if (promedio >= 4.5) return "default" // Verde/Primary
    if (promedio >= 4.0) return "secondary"
    if (promedio >= 3.5) return "outline"
    return "destructive"
  }

  // Obtener color de texto según promedio
  const getPromedioColor = (promedio: number) => {
    if (promedio >= 4.5) return "text-green-600 dark:text-green-400"
    if (promedio >= 4.0) return "text-blue-600 dark:text-blue-400"
    if (promedio >= 3.5) return "text-yellow-600 dark:text-yellow-400"
    if (promedio >= 3.0) return "text-orange-600 dark:text-orange-400"
    return "text-red-600 dark:text-red-400"
  }

  if (!docentes || docentes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          No hay docentes para mostrar
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>{titulo}</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar docente..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPaginaActual(1)
              }}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort("nombre")}
                    className="-ml-3"
                  >
                    Nombre
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort("programa")}
                    className="-ml-3"
                  >
                    Programa
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort("promedio")}
                    className="-ml-3"
                  >
                    Promedio
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-center hidden sm:table-cell">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSort("comentarios")}
                    className="-ml-3"
                  >
                    Comentarios
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">Materias</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docentesPaginados.map((docente) => (
                <TableRow key={docente.documento}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{docente.nombre}</p>
                      <p className="text-xs text-muted-foreground">{docente.documento}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm">{docente.programa || "-"}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getBadgeVariant(docente.promedio_general)}>
                      <span className={getPromedioColor(docente.promedio_general)}>
                        {docente.promedio_general.toFixed(2)}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span>{docente.total_comentarios || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{docente.materias.length}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onVerDetalle(docente)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver detalle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {(paginaActual - 1) * itemsPorPagina + 1} -{" "}
              {Math.min(paginaActual * itemsPorPagina, docentesFiltrados.length)} de{" "}
              {docentesFiltrados.length} docentes
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let pagina: number
                  if (totalPaginas <= 5) {
                    pagina = i + 1
                  } else if (paginaActual <= 3) {
                    pagina = i + 1
                  } else if (paginaActual >= totalPaginas - 2) {
                    pagina = totalPaginas - 4 + i
                  } else {
                    pagina = paginaActual - 2 + i
                  }

                  return (
                    <Button
                      key={pagina}
                      variant={paginaActual === pagina ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaginaActual(pagina)}
                      className="w-8"
                    >
                      {pagina}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
