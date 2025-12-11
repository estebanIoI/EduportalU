import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogOut, User } from "lucide-react"

interface DocenteHeaderProps {
  nombreDocente: string
  cedulaDocente: string
  sede?: string
  onLogout?: () => void
}

export function DocenteHeader({ nombreDocente, cedulaDocente, sede, onLogout }: DocenteHeaderProps) {
  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    }
  }

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{nombreDocente}</h1>
              <div className="flex gap-3 text-sm text-gray-500">
                <span>Cédula: {cedulaDocente}</span>
                {sede && <span>• {sede}</span>}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </header>
  )
}
