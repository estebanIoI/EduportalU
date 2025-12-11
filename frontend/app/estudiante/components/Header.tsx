"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { authService } from "@/services/evaluacionITP/auth/auth.service"
import { PerfilEstudiante } from "@/lib/types/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  User, 
  LogOut, 
  Settings, 
  BookOpen, 
  Calendar,
  ChevronDown,
  Bell,
  Home,
  Moon,
  Sun,
  GraduationCap,
  Clock,
  MapPin,
  Phone,
  Mail,
  Award,
  TrendingUp,
  ChevronRight,
  Building2,
  FileText,
  Loader2,
  ArrowLeft
} from "lucide-react"

interface User {
  id: number
  name: string
  username: string
  primaryRole: string
  additionalRoles: string[]
}

interface HeaderProps {
  onLogout?: () => void
  isDarkMode?: boolean
  onToggleDarkMode?: () => void
  notifications?: number
}

export function Header({ 
  onLogout, 
  isDarkMode = false, 
  onToggleDarkMode,
  notifications = 0 
}: HeaderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isHoveringLogo, setIsHoveringLogo] = useState(false)
  const [perfilAcademico, setPerfilAcademico] = useState<PerfilEstudiante | null>(null)
  const [loadingPerfil, setLoadingPerfil] = useState(false)
  
  const pathname = usePathname()
  const router = useRouter()
  
  // Detectar si estamos en una página de evaluación (incluye dashboard con ID, evaluacion y evaluar)
  const isInEvaluacion = pathname?.includes('/estudiante/evaluacion/') || 
                         pathname?.includes('/estudiante/evaluar/') ||
                         (pathname?.includes('/estudiante/dashboard/') && pathname !== '/estudiante/dashboard')

  // Cargar perfil del usuario desde localStorage
  useEffect(() => {
    const loadUserProfile = () => {
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          setUser(userData)
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
      }
    }

    loadUserProfile()
  }, [])

  // Cargar perfil académico del estudiante desde el backend
  useEffect(() => {
    const cargarPerfilAcademico = async () => {
      try {
        setLoadingPerfil(true)
        const response = await authService.getProfile()
        if (response.success && response.data && response.data.tipo === "estudiante") {
          setPerfilAcademico(response.data as PerfilEstudiante)
        }
      } catch (error) {
        console.error('Error cargando perfil académico:', error)
      } finally {
        setLoadingPerfil(false)
      }
    }

    if (user) {
      cargarPerfilAcademico()
    }
  }, [user])

  // Actualizar hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Detectar scroll para cambiar apariencia del header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Función para capitalizar nombres
  const capitalizeName = (name: string) => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getInitials = (name: string) => {
    return capitalizeName(name)
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLogout = () => {
    // Limpiar localStorage
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    
    if (onLogout) {
      onLogout()
    } else {
      window.location.href = "/"
    }
  }

  const getSemesterProgress = () => {
    const currentDate = new Date()
    const semesterStart = new Date(currentDate.getFullYear(), 1, 15)
    const semesterEnd = new Date(currentDate.getFullYear(), 5, 30)
    const progress = Math.min(100, Math.max(0, 
      ((currentDate.getTime() - semesterStart.getTime()) / 
       (semesterEnd.getTime() - semesterStart.getTime())) * 100
    ))
    return Math.round(progress)
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Buenos días"
    if (hour < 18) return "Buenas tardes"
    return "Buenas noches"
  }

  // Si no hay usuario cargado, mostrar estado de carga
  if (!user) {
    return (
      <header className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-2xl shadow-sm border-b border-gray-200/60 dark:bg-gray-900/80 dark:border-gray-700/60">
        <div className="container mx-auto flex h-18 md:h-22 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-lg">
                <GraduationCap className="h-6 w-6 md:h-7 md:w-7" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-gray-800 via-blue-900 to-gray-800 dark:from-gray-100 dark:via-blue-200 dark:to-gray-100 bg-clip-text text-transparent">
                  EduPortal
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                  Portal Académico
                </p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          </div>
        </div>
      </header>
    )
  }

  // Nombre capitalizado para usar en toda la aplicación
  const capitalizedName = capitalizeName(user.name)
  
  return (
    <>
      <style jsx>{`
        .marquee-container {
          width: 160px;
          overflow: hidden;
          position: relative;
          mask: linear-gradient(90deg, transparent, white 15px, white calc(100% - 15px), transparent);
          -webkit-mask: linear-gradient(90deg, transparent, white 15px, white calc(100% - 15px), transparent);
        }
        
        .marquee-content {
          display: flex;
          animation: marquee-scroll 15s linear infinite;
          width: max-content;
        }
        
        .marquee-text {
          padding-right: 50px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        
        .marquee-container:hover .marquee-content {
          animation-play-state: paused;
        }
        
        /* Animación mejorada - el texto se duplica para crear un loop infinito perfecto */
        @keyframes marquee-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        /* Para nombres muy largos - velocidad más lenta */
        .marquee-slow {
          animation: marquee-scroll-slow 10s linear infinite;
        }
        
        @keyframes marquee-scroll-slow {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        /* Para nombres cortos - sin animación */
        .marquee-static {
          animation: none;
          justify-content: flex-end;
        }
        
        .marquee-static .marquee-text {
          padding-right: 0;
        }
      `}</style>

      <header className={`fixed top-0 z-50 w-full transition-all duration-700 ease-out ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-2xl shadow-2xl border-b border-gray-200/60 dark:bg-gray-900/80 dark:border-gray-700/60' 
          : 'bg-white/60 backdrop-blur-xl border-b border-gray-100/40 dark:bg-gray-900/60 dark:border-gray-800/40'
      }`}>
        <div className="relative container mx-auto flex h-18 md:h-22 items-center justify-between px-4 sm:px-6">
          
          {/* Logo y botón volver */}
          <div className="flex items-center gap-4">
            {/* Botón volver atrás - visible solo en evaluación */}
            {isInEvaluacion && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/40 dark:hover:to-blue-800/40 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 group"
                title="Volver atrás"
              >
                <ArrowLeft className="h-5 w-5 md:h-6 md:w-6 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
              </Button>
            )}
            
            <Link 
              href="/" 
              className="flex items-center gap-3 group"
              onMouseEnter={() => setIsHoveringLogo(true)}
              onMouseLeave={() => setIsHoveringLogo(false)}
            >
              <div className="relative flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-lg hover:shadow-2xl transition-all duration-700 hover:scale-110 group-hover:rotate-12 overflow-hidden">
                <GraduationCap className="h-6 w-6 md:h-7 md:w-7 transition-all duration-700 group-hover:scale-125 relative z-10 drop-shadow-md" />
              </div>
              
              <div className="hidden sm:block">
                <div className="relative">
                  <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-gray-800 via-blue-900 to-gray-800 dark:from-gray-100 dark:via-blue-200 dark:to-gray-100 bg-clip-text text-transparent relative tracking-wide">
                    EduPortal
                  </h1>
                  <div className={`absolute -bottom-1 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full transition-all duration-700 ${
                    isHoveringLogo ? 'w-full opacity-100 shadow-lg shadow-blue-500/50' : 'w-0 opacity-0'
                  }`} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium tracking-wider">
                  Portal Académico
                </p>
              </div>
            </Link>
          </div>

          {/* Panel de acciones */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Panel de usuario con carrusel de nombre mejorado */}
            <div className="hidden lg:flex items-center gap-4 px-5 py-3 rounded-2xl bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 hover:from-blue-50 hover:via-white hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:via-gray-700 dark:hover:to-purple-900/20 transition-all duration-700 group cursor-pointer border border-gray-200/50 dark:border-gray-600/50 shadow-sm hover:shadow-md">
              <div className="text-right min-w-[180px]">
                <div className="marquee-container">
                  <div className={`marquee-content ${
                    capitalizedName.length > 25 ? 'marquee-slow' : 
                    capitalizedName.length > 20 ? '' : 'marquee-static'
                  }`}>
                    <span className="marquee-text text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight transition-colors duration-500 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                      {capitalizedName}
                    </span>
                    {capitalizedName.length > 20 && (
                      <span className="marquee-text text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight transition-colors duration-500 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                        {capitalizedName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end mt-1">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm animate-pulse" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-medium">
                      {user.primaryRole}
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-300 to-transparent dark:via-gray-600" />
              <div className="text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                  {getGreeting()}
                </p>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Avatar dropdown */}
            <DropdownMenu onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-11 w-11 md:h-12 md:w-12 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-500 hover:scale-110"
                >
                  <Avatar className="h-9 w-9 md:h-10 md:w-10 transition-all duration-500 group-hover:ring-4 group-hover:ring-blue-500/30 group-hover:shadow-lg">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white font-bold text-sm">
                      {getInitials(capitalizedName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <ChevronDown className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-full p-0.5 border-2 border-gray-200 dark:border-gray-600 transition-all duration-500 shadow-sm ${
                    isDropdownOpen ? 'rotate-180 bg-blue-100 text-blue-600 dark:bg-blue-900/70 dark:text-blue-300 border-blue-300 dark:border-blue-600' : ''
                  } group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-blue-900/70 dark:group-hover:text-blue-300 group-hover:border-blue-300 dark:group-hover:border-blue-600`} />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent 
                className="w-80 md:w-96 p-6 shadow-2xl border-gray-100 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl animate-in zoom-in-95 fade-in-20 duration-300 rounded-2xl"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal p-0">
                  <div className="flex flex-col space-y-5">
                    {/* Header del perfil */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-800 dark:via-gray-700 dark:to-blue-900/20 hover:from-blue-50 hover:to-purple-50/30 dark:hover:from-blue-900/30 dark:hover:to-purple-900/20 transition-all duration-700 transform hover:-translate-y-1 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-lg">
                      <Avatar className="h-14 w-14 md:h-16 md:w-16 ring-4 ring-blue-500/20 dark:ring-blue-400/20 transition-all duration-500 hover:ring-6 hover:ring-blue-500/40 hover:scale-110 shadow-lg">
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white font-black text-lg">
                          {getInitials(capitalizedName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="marquee-container" style={{ width: '200px' }}>
                          <div className={`marquee-content ${
                            capitalizedName.length > 25 ? 'marquee-slow' : 
                            capitalizedName.length > 18 ? '' : 'marquee-static'
                          }`}>
                            <span className="marquee-text text-lg font-black text-gray-900 dark:text-white">
                              {capitalizedName}
                            </span>
                            {capitalizedName.length > 18 && (
                              <span className="marquee-text text-lg font-black text-gray-900 dark:text-white">
                                {capitalizedName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <User className="h-4 w-4" />
                          <span className="font-medium">@{user.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs px-3 py-1 bg-gradient-to-r from-blue-100 via-purple-100 to-blue-100 dark:from-blue-900/50 dark:via-purple-900/50 dark:to-blue-900/50 border-0 font-bold shadow-sm">
                            {getGreeting()} ✨
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Roles del usuario */}
                    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50/30 dark:from-blue-900/20 dark:via-gray-800 dark:to-purple-900/20 rounded-2xl p-5 border border-blue-200/30 dark:border-blue-800/30 hover:shadow-md transition-all duration-500 hover:-translate-y-0.5">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-500 p-2 rounded-xl shadow-lg">
                            <Award className="h-5 w-5 text-white" />
                          </div>
                          <p className="text-lg font-black text-blue-800 dark:text-blue-200">Roles del Usuario</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold">
                            {user.primaryRole}
                          </Badge>
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Principal</span>
                        </div>
                        {user.additionalRoles.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {user.additionalRoles.map((role, index) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-700">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center bg-gradient-to-br from-blue-50 via-white to-blue-100/50 dark:from-blue-900/20 dark:via-gray-800 dark:to-blue-800/20 rounded-2xl p-4 hover:from-blue-100 hover:to-blue-200/50 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 transition-all duration-700 cursor-pointer group hover:shadow-xl hover:-translate-y-2 border border-blue-200/30 dark:border-blue-700/30">
                        <div className="flex items-center justify-center mb-3">
                          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3 group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-lg">
                            <User className="h-6 w-6 text-white drop-shadow-sm" />
                          </div>
                        </div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-bold mb-2">ID Usuario</p>
                        <p className="text-2xl font-black text-blue-900 dark:text-blue-100 group-hover:text-blue-700 dark:group-hover:text-blue-200 transition-colors duration-500">
                          {user.id}
                        </p>
                      </div>
                      <div className="text-center bg-gradient-to-br from-purple-50 via-white to-purple-100/50 dark:from-purple-900/20 dark:via-gray-800 dark:to-purple-800/20 rounded-2xl p-4 hover:from-purple-100 hover:to-purple-200/50 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30 transition-all duration-700 cursor-pointer group hover:shadow-xl hover:-translate-y-2 border border-purple-200/30 dark:border-purple-700/30">
                        <div className="flex items-center justify-center mb-3">
                          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-3 group-hover:from-purple-600 group-hover:to-purple-700 transition-all duration-500 group-hover:-rotate-12 group-hover:scale-110 shadow-lg">
                            <Award className="h-6 w-6 text-white drop-shadow-sm" />
                          </div>
                        </div>
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-bold mb-2">Roles Totales</p>
                        <p className="text-2xl font-black text-purple-900 dark:text-purple-100 group-hover:text-purple-700 dark:group-hover:text-purple-200 transition-colors duration-500">
                          {1 + user.additionalRoles.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-4 bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700 h-[1px]" />
                <DropdownMenuGroup>
                  <DropdownMenuItem 
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all duration-300 hover:pl-5"
                    onClick={() => setShowProfileModal(true)}
                  >
                    <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100">Mi Perfil</p>
                      {loadingPerfil ? (
                        <div className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                          <span className="text-xs text-gray-400">Cargando...</span>
                        </div>
                      ) : perfilAcademico ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {perfilAcademico.programa} • Sem. {perfilAcademico.semestre}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Ver información detallada</p>
                      )}
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer transition-all duration-300 hover:pl-5">
                    <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-lg">
                      <Settings className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Configuración</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ajustar preferencias</p>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="my-4 bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700 h-[1px]" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-all duration-300 hover:pl-5 text-red-600 dark:text-red-400"
                >
                  <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-lg">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Cerrar Sesión</p>
                    <p className="text-xs text-red-500 dark:text-red-400/80">Salir de tu cuenta</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Modal de perfil */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Perfil del Estudiante
            </DialogTitle>
          </DialogHeader>
          
          {loadingPerfil ? (
            <div className="grid gap-6 py-4">
              <div className="flex items-center gap-6">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          ) : perfilAcademico ? (
            <div className="grid gap-6 py-4">
              {/* Header del perfil */}
              <div className="flex items-center gap-6 p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-900/20 dark:via-gray-800 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800/30">
                <Avatar className="h-20 w-20 ring-4 ring-blue-500/20">
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-bold text-xl">
                    {getInitials(perfilAcademico.nombre_completo)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {capitalizeName(perfilAcademico.nombre_completo)}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {perfilAcademico.tipo_doc}: {perfilAcademico.documento}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                      {perfilAcademico.estado_matricula}
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      Semestre {perfilAcademico.semestre}
                    </Badge>
                    {perfilAcademico.grupo && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        Grupo {perfilAcademico.grupo}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Información académica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Programa</p>
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate" title={perfilAcademico.programa}>
                      {perfilAcademico.programa}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-lg">
                    <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sede</p>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{perfilAcademico.sede}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2.5 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Periodo</p>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{perfilAcademico.periodo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-lg">
                    <BookOpen className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Materias Inscritas</p>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {perfilAcademico.materias?.length || 0} materias
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de materias */}
              {perfilAcademico.materias && perfilAcademico.materias.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Materias del Periodo
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {perfilAcademico.materias.map((materia, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 border border-gray-100 dark:border-gray-700"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate" title={materia.nombre}>
                            {materia.nombre}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Código: {materia.codigo}
                          </p>
                        </div>
                        <div className="text-right ml-3 shrink-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Docente</p>
                          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate max-w-[150px]" title={materia.docente?.nombre}>
                            {materia.docente?.nombre || 'Sin asignar'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Roles del usuario */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-indigo-600" />
                  Roles Asignados
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
                    {perfilAcademico.roles.principal.nombre}
                  </Badge>
                  {perfilAcademico.roles.adicionales.map((rol, index) => (
                    <Badge key={index} variant="secondary" className="bg-white/80 dark:bg-gray-700/80">
                      {rol.nombre}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 py-4">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-bold text-xl">
                    {getInitials(capitalizedName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{capitalizedName}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{user?.primaryRole}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {user?.primaryRole}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <p>No se pudo cargar la información académica completa.</p>
                <p className="text-sm">Intenta recargar la página.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}