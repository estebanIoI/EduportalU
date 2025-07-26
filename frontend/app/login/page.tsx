"use client"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/services/evaluacionITP/auth/auth.service"
import { UserRound, Eye, EyeOff, LogIn } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") || "estudiante"
  const { toast } = useToast()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [loginStage, setLoginStage] = useState<'idle' | 'loading' | 'success' | 'redirecting'>('idle')

  // Cargar usuario recordado y activar animaciones
  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername")
    if (savedUsername) {
      setUsername(savedUsername)
      setRememberMe(true)
    }
    
    setTimeout(() => setIsPageLoaded(true), 100)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Cambiar inmediatamente a estado de carga
    setLoginStage('loading')

    try {
      const response = await authService.login({
        user_username: username,
        user_password: password,
      })

      if (response.success) {
        // Cambiar a estado de éxito
        setLoginStage('success')

        // Manejar recordar usuario
        if (rememberMe) {
          localStorage.setItem("rememberedUsername", username)
        } else {
          localStorage.removeItem("rememberedUsername")
        }

        // Obtener datos del usuario desde la respuesta
        const userData = response.data.user

        // ✅ NUEVO: Guardar datos del usuario en localStorage
        localStorage.setItem("user", JSON.stringify(userData))

        // Combinar rol principal con roles adicionales
        const allRoles = [
          userData.primaryRole.toLowerCase(),
          ...userData.additionalRoles.map((rol) => rol.toLowerCase())
        ]

        // Determinar ruta de redirección
        let redirectPath = ""

        if (allRoles.includes("admin")) {
          redirectPath = "/admin/dashboard"
        } else if (allRoles.includes("director programa")) {
          // Asegura que si tiene rol de director programa, va al dashboard de docente
          redirectPath = "/docente/dashboard"
        } else if (allRoles.includes("docente")) {
          redirectPath = "/docente/dashboard"
        } else if (allRoles.includes("estudiante")) {
          redirectPath = "/estudiante/bienvenida"
        } else {
          toast({
            title: "Error",
            description: "Rol de usuario no reconocido",
            variant: "destructive",
          })
          setLoginStage('idle')
          return
        }

        // Mostrar mensaje de bienvenida
        toast({
          title: "Bienvenido",
          description: response.message,
        })

        // Cambiar a estado de redirección después de un breve delay
        setTimeout(() => {
          setLoginStage('redirecting')
        }, 800)

        // Redirigir después de mostrar el mensaje
        setTimeout(() => {
          router.replace(redirectPath)
        }, 1500)
      }
    } catch (error: any) {
      // Resetear estado en caso de error
      setLoginStage('idle')
      
      toast({
        title: "Error de autenticación",
        description: error.message || "Credenciales incorrectas",
        variant: "destructive",
      })
    }
  }

  const getButtonContent = () => {
    switch (loginStage) {
      case 'loading':
        return (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Verificando...
          </div>
        )
      case 'success':
        return (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 text-green-400">✓</div>
            ¡Bienvenido!
          </div>
        )
      case 'redirecting':
        return (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Redirigiendo...
          </div>
        )
      default:
        return "Acceder"
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      
      {/* Contenedor principal con animación de entrada */}
      <div className={`flex flex-col md:flex-row w-full max-w-7xl bg-white shadow-xl rounded-xl overflow-hidden transform transition-all duration-700 ease-out ${
        isPageLoaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
      }`}>
        
        {/* Logo adaptable con animación */}
        <div className={`flex items-center justify-center w-full md:w-2/2 transition-all duration-500 delay-200 ease-out bg-cover bg-center bg-no-repeat transform hover:scale-105 duration-300 ${
          isPageLoaded ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-0'
        }`}
        style={{
          backgroundImage: 'url(https://itp.edu.co/ITP2022/wp-content/uploads/2023/02/245216850_2524156664394432_3397011422600315621_n-scaled.jpg)', //https://itp.edu.co/ITP2022/wp-content/uploads/2023/02/245216850_2524156664394432_3397011422600315621_n-scaled.jpg 
        }}>
        </div>

        {/* Formulario de Login con animación */}
        <div className={`w-full md:w-1/2 md:p-6 flex flex-col justify-center transition-all duration-500 delay-400 ease-out ${
          isPageLoaded ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'
        }`}>
          
          <CardHeader className="text-center mb-2">
            {/* Logo del ITP - Responsivo */}
            <div className="flex justify-center mb-4">
              <img 
                src="https://scontent-bog2-2.xx.fbcdn.net/v/t39.30808-6/518273401_1335532245246623_8297795156351999546_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=o9ecBuvGuCAQ7kNvwHmZeVV&_nc_oc=AdlaC-K0RX_FBTPkn4zBeY-SIcTx8YcOaVn9bl--ylUn4q7zCo9RFcoz7rOog_7w59hF85nS2tfl7fpoo1q6X-fJ&_nc_zt=23&_nc_ht=scontent-bog2-2.xx&_nc_gid=MqXomCdF-vjn0Tx9o3T-pw&oh=00_AfSTyHzvrifVRB95vfthE4Zez2shBcupwoVzTbqh5Vs7dA&oe=6889D17D" //https://sibcolombia.net/wp-content/uploads/2017/08/logo-itp.png
                alt="Logo Instituto Tecnológico del Putumayo"
                className="h-16 w-auto sm:h-20 md:h-24 lg:h-64 object-contain transform hover:scale-105 h-64 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            
            <CardTitle className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-semibold text-gray-800 transform hover:scale-105 transition-transform duration-200">
              <LogIn size={24} />
              Evaluaciones Académicas
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1 px-2">
              Solo para estudiantes{" "}
              <span className="hover:scale-105 transition-transform duration-200 inline-block">
                <strong>matriculados</strong>
              </span>.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin} className="w-full">
            <CardContent className="space-y-4">
              
              {/* Campo de usuario */}
              <div className="relative group">
                <UserRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-gray-700 transition-colors duration-200 z-10 pointer-events-none" size={18} />
                <Input
                  id="username"
                  placeholder="Documento"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loginStage !== 'idle'}
                  className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 hover:border-gray-400 transition-all duration-200 transform focus:scale-[1.01] relative disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Campo de contraseña */}
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="Contraseña"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loginStage !== 'idle'}
                  className="pr-10 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 hover:border-gray-400 transition-all duration-200 transform focus:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loginStage !== 'idle'}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:text-gray-700 transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20 rounded disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    disabled={loginStage !== 'idle'}
                    className="accent-blue-600 transform group-hover:scale-110 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="group-hover:text-gray-800 transition-colors duration-200 group-hover:scale-105 transition-transform duration-200 inline-block">
                    Recordarme
                  </span>
                </label>
                
                <a
                  href="https://sigedin.itp.edu.co/estudiantes/ctrl_recoverpassword/ctrl_recoverpassword.php"
                  className="text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105 transition-transform duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-4">
              <Button 
                className="w-full transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 shadow-md hover:shadow-lg disabled:transform-none disabled:hover:scale-100" 
                type="submit" 
                disabled={loginStage !== 'idle'}
              >
                {getButtonContent()}
              </Button>
              
            </CardFooter>
          </form>
        </div>
      </div>

      <footer className={`text-center text-xs text-gray-400 mt-6 transition-all duration-700 delay-600 ease-out ${
        isPageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        © {new Date().getFullYear()} Institución Universitaria del Putumayo – Todos los derechos reservados
      </footer>
    </div>
  )
}