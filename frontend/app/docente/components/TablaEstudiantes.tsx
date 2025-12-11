import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle } from "lucide-react"

interface Estudiante {
  id_estudiante: string
  nombre_estudiante: string
  evaluado: boolean
}

interface TablaEstudiantesProps {
  estudiantes: Estudiante[]
  isLoading?: boolean
}

export function TablaEstudiantes({ estudiantes, isLoading }: TablaEstudiantesProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (estudiantes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay estudiantes asignados a esta asignatura
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">#</TableHead>
            <TableHead>Cédula</TableHead>
            <TableHead>Nombre del Estudiante</TableHead>
            <TableHead className="text-right">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estudiantes.map((estudiante, index) => (
            <TableRow key={estudiante.id_estudiante}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>{estudiante.id_estudiante}</TableCell>
              <TableCell>{estudiante.nombre_estudiante}</TableCell>
              <TableCell className="text-right">
                {estudiante.evaluado ? (
                  <Badge className="bg-green-500 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Evaluado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600 gap-1">
                    <XCircle className="h-3 w-3" />
                    Pendiente
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
