"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Loader2 } from "lucide-react"
import { healthService } from "@/services/health.service"

interface ConnectionStatusProps {
  showAlways?: boolean // Si es true, siempre muestra el indicador. Si es false, solo muestra cuando hay problemas
  className?: string
}

export function ConnectionStatus({ showAlways = false, className = "" }: ConnectionStatusProps) {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null)
  const [message, setMessage] = useState<string>("")
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Verificación inicial
    const initialCheck = async () => {
      setIsChecking(true)
      const status = await healthService.checkBackendHealth()
      setIsHealthy(status.isHealthy)
      setMessage(status.message)
      setIsChecking(false)
    }

    initialCheck()

    // Monitoreo continuo (cada 30 segundos)
    const stopMonitoring = healthService.startHealthMonitoring(30000, (status) => {
      setIsHealthy(status.isHealthy)
      setMessage(status.message)
    })

    return () => {
      stopMonitoring()
    }
  }, [])

  // No mostrar nada si está cargando y showAlways es false
  if (isChecking && !showAlways) {
    return null
  }

  // No mostrar nada si la conexión está bien y showAlways es false
  if (isHealthy && !showAlways) {
    return null
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Badge
        variant={isHealthy ? "default" : "destructive"}
        className={`flex items-center gap-2 px-4 py-2 shadow-lg transition-all duration-300 ${
          isChecking ? "animate-pulse" : ""
        }`}
      >
        {isChecking ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isHealthy ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4 animate-pulse" />
        )}
        <span className="font-medium">
          {isChecking ? "Verificando conexión..." : message}
        </span>
      </Badge>
    </div>
  )
}
