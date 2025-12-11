"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Bar } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface DatosComparativa {
  nombre: string
  promedio: number
  totalDocentes?: number
  totalEvaluaciones?: number
}

interface Props {
  items: DatosComparativa[]
  titulo: string
  etiqueta: string
  colorPrimario?: string
}

export function GraficaComparativa({
  items,
  titulo,
  etiqueta,
  colorPrimario = "rgba(59, 130, 246, 0.6)",
}: Props) {
  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center text-muted-foreground">
          No hay datos disponibles para comparar
        </CardContent>
      </Card>
    )
  }

  // Ordenar por promedio descendente
  const itemsOrdenados = [...items].sort((a, b) => b.promedio - a.promedio)

  // Generar colores basados en el promedio
  const generarColores = (promedios: number[]) => {
    return promedios.map((promedio) => {
      if (promedio >= 4.5) return "rgba(34, 197, 94, 0.7)" // Verde
      if (promedio >= 4.0) return "rgba(59, 130, 246, 0.7)" // Azul
      if (promedio >= 3.5) return "rgba(234, 179, 8, 0.7)" // Amarillo
      if (promedio >= 3.0) return "rgba(249, 115, 22, 0.7)" // Naranja
      return "rgba(239, 68, 68, 0.7)" // Rojo
    })
  }

  const promedios = itemsOrdenados.map((item) => item.promedio)
  const colores = generarColores(promedios)

  const data = {
    labels: itemsOrdenados.map((item) => item.nombre),
    datasets: [
      {
        label: etiqueta,
        data: promedios,
        backgroundColor: colores,
        borderColor: colores.map((c) => c.replace("0.7", "1")),
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const item = itemsOrdenados[context.dataIndex]
            const lines = [`Promedio: ${context.raw.toFixed(2)}`]
            if (item.totalDocentes !== undefined) {
              lines.push(`Docentes: ${item.totalDocentes}`)
            }
            if (item.totalEvaluaciones !== undefined) {
              lines.push(`Evaluaciones: ${item.totalEvaluaciones}`)
            }
            return lines
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 0.5,
        },
      },
      y: {
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  }

  // Calcular altura dinámica basada en número de items
  const alturaBase = 60
  const alturaPorItem = 35
  const altura = Math.min(Math.max(alturaBase + items.length * alturaPorItem, 200), 600)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent style={{ height: altura }}>
        <Bar data={data} options={options} />
      </CardContent>
    </Card>
  )
}

// Versión mini para comparativas rápidas
interface PropsMini {
  items: { nombre: string; valor: number }[]
  titulo: string
}

export function GraficaComparativaMini({ items, titulo }: PropsMini) {
  if (!items || items.length === 0) return null

  const max = Math.max(...items.map((i) => i.valor))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.slice(0, 5).map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="truncate flex-1 pr-2">{item.nombre}</span>
              <span className="font-medium">{item.valor.toFixed(2)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(item.valor / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Comparativa de aspectos entre programas o facultades
interface PropsComparativaAspectos {
  items: {
    nombre: string
    aspectos: { nombre: string; promedio: number }[]
  }[]
  titulo: string
}

export function GraficaComparativaAspectos({ items, titulo }: PropsComparativaAspectos) {
  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center text-muted-foreground">
          No hay datos disponibles
        </CardContent>
      </Card>
    )
  }

  // Obtener todos los aspectos únicos
  const aspectosUnicos = new Set<string>()
  items.forEach((item) => {
    item.aspectos.forEach((asp) => aspectosUnicos.add(asp.nombre))
  })
  const labels = Array.from(aspectosUnicos)

  // Colores para cada item
  const coloresBase = [
    "rgba(59, 130, 246, 0.6)", // Azul
    "rgba(34, 197, 94, 0.6)", // Verde
    "rgba(168, 85, 247, 0.6)", // Púrpura
    "rgba(249, 115, 22, 0.6)", // Naranja
    "rgba(236, 72, 153, 0.6)", // Rosa
    "rgba(20, 184, 166, 0.6)", // Teal
  ]

  const datasets = items.map((item, index) => {
    const valores = labels.map((aspecto) => {
      const asp = item.aspectos.find((a) => a.nombre === aspecto)
      return asp ? asp.promedio : 0
    })

    return {
      label: item.nombre,
      data: valores,
      backgroundColor: coloresBase[index % coloresBase.length],
      borderColor: coloresBase[index % coloresBase.length].replace("0.6", "1"),
      borderWidth: 1,
    }
  })

  const data = {
    labels,
    datasets,
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        max: 5,
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="h-96">
        <Bar data={data} options={options} />
      </CardContent>
    </Card>
  )
}
