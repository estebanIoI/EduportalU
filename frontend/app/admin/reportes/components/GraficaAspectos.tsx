"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Docente, DatosGrafica } from "@/lib/types/reportes.types"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js"
import { Bar, Radar } from "react-chartjs-2"

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
)

interface PropsDocentes {
  docentes: Docente[]
  titulo: string
}

interface PropsDatos {
  datos: DatosGrafica
  titulo: string
}

// Gráfica consolidada por aspectos de todos los docentes
export function GraficaAspectos({ docentes, datos, titulo }: PropsDocentes & Partial<PropsDatos>) {
  // Si se proporcionan datos directamente, usarlos
  if (datos) {
    return <GraficaAspectosDirecta datos={datos} titulo={titulo} />
  }

  // Si no, calcular desde docentes
  if (!docentes || docentes.length === 0) {
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

  // Consolidar datos de todos los docentes
  const aspectosMap = new Map<string, { suma: number; count: number }>()

  docentes.forEach((docente) => {
    docente.materias.forEach((materia) => {
      materia.aspectos.forEach((aspecto) => {
        const existing = aspectosMap.get(aspecto.nombre) || { suma: 0, count: 0 }
        aspectosMap.set(aspecto.nombre, {
          suma: existing.suma + aspecto.promedio,
          count: existing.count + 1,
        })
      })
    })
  })

  const labels = Array.from(aspectosMap.keys())
  const values = Array.from(aspectosMap.values()).map((v) => (v.suma / v.count).toFixed(2))

  const data = {
    labels,
    datasets: [
      {
        label: "Promedio",
        data: values.map((v) => parseFloat(v)),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Promedio: ${context.raw.toFixed(2)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <Bar data={data} options={options} />
      </CardContent>
    </Card>
  )
}

// Gráfica con datos directos
function GraficaAspectosDirecta({ datos, titulo }: PropsDatos) {
  const data = {
    labels: datos.labels,
    datasets: [
      {
        label: "Promedio",
        data: datos.values.map((v) => (typeof v === "string" ? parseFloat(v) : v)),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
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
      <CardContent className="h-80">
        <Bar data={data} options={options} />
      </CardContent>
    </Card>
  )
}

// Gráfica de radar por materia
interface PropsRadar {
  materia: {
    nombre: string
    grafica: DatosGrafica
  }
}

export function GraficaRadarMateria({ materia }: PropsRadar) {
  const data = {
    labels: materia.grafica.labels,
    datasets: [
      {
        label: materia.nombre,
        data: materia.grafica.values.map((v) => (typeof v === "string" ? parseFloat(v) : v)),
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{materia.nombre}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <Radar data={data} options={options} />
      </CardContent>
    </Card>
  )
}

// Gráfica de barras horizontal para distribución de valoraciones
interface PropsDistribucion {
  distribucion: { E: number; B: number; A: number; D: number }
  titulo: string
}

export function GraficaDistribucion({ distribucion, titulo }: PropsDistribucion) {
  const data = {
    labels: ["Excelente", "Bueno", "Aceptable", "Deficiente"],
    datasets: [
      {
        label: "Cantidad",
        data: [distribucion.E, distribucion.B, distribucion.A, distribucion.D],
        backgroundColor: [
          "rgba(34, 197, 94, 0.6)", // Verde - Excelente
          "rgba(59, 130, 246, 0.6)", // Azul - Bueno
          "rgba(234, 179, 8, 0.6)", // Amarillo - Aceptable
          "rgba(239, 68, 68, 0.6)", // Rojo - Deficiente
        ],
        borderColor: [
          "rgba(34, 197, 94, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(234, 179, 8, 1)",
          "rgba(239, 68, 68, 1)",
        ],
        borderWidth: 1,
      },
    ],
  }

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="h-32">
      <p className="text-sm font-medium mb-2">{titulo}</p>
      <Bar data={data} options={options} />
    </div>
  )
}
