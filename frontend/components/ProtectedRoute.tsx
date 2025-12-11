'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

// Definir mapeo de roles a rutas y prioridad
const ROLE_ROUTES: Record<string, string> = {
  'Admin': '/admin/dashboard',
  'Director Programa': '/docente/dashboard',
  'Docente': '/docente/dashboard',
  'Estudiante': '/estudiante/bienvenida',
};

const ROLE_PRIORITY = ['Admin', 'Director Programa', 'Docente', 'Estudiante'];

// Función auxiliar para normalizar y comparar roles
const normalizeRole = (role: string): string => {
  const roleLower = role.toLowerCase().trim();
  // Mapear variantes de roles de docente
  if (roleLower.includes('docente') || roleLower === 'docente_planta' || roleLower === 'docente_catedra') {
    return 'docente';
  }
  if (roleLower === 'admin' || roleLower === 'administrador') {
    return 'admin';
  }
  if (roleLower === 'director programa' || roleLower === 'director_programa') {
    return 'director programa';
  }
  if (roleLower === 'estudiante') {
    return 'estudiante';
  }
  return roleLower;
};

// Función para verificar si un rol del usuario coincide con un rol permitido
const roleMatches = (userRole: string, allowedRole: string): boolean => {
  const normalizedUserRole = normalizeRole(userRole);
  const normalizedAllowedRole = normalizeRole(allowedRole);
  return normalizedUserRole === normalizedAllowedRole;
};

// Función para obtener la ruta de redirección basada en el tipo de usuario o rol
const getRedirectPath = (userType: string, userRoles: string[]): string => {
  const normalizedType = normalizeRole(userType);
  
  // Primero verificar por tipo de usuario
  if (normalizedType === 'docente') {
    return '/docente/dashboard';
  }
  if (normalizedType === 'estudiante') {
    return '/estudiante/bienvenida';
  }
  if (normalizedType === 'admin') {
    return '/admin/dashboard';
  }
  
  // Luego verificar por roles
  for (const role of ROLE_PRIORITY) {
    if (userRoles.some(userRole => roleMatches(userRole, role))) {
      return ROLE_ROUTES[role];
    }
  }
  
  return '/login';
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      // Si se especifican roles permitidos, verificar el rol del usuario
      if (allowedRoles && allowedRoles.length > 0) {
        try {
          const profileResponse = await authService.getProfile();
          
          if (profileResponse.success && profileResponse.data) {
            const userProfile = profileResponse.data;
            // Incluir tanto el rol principal como los roles adicionales
            const userRoles = [
              userProfile.roles.principal.nombre,
              ...userProfile.roles.adicionales.map((rol: any) => rol.nombre)
            ];
            
            console.log('🔍 ProtectedRoute Debug:');
            console.log('  Roles del usuario:', userRoles);
            console.log('  Roles permitidos:', allowedRoles);
            console.log('  Tipo de usuario:', userProfile.tipo);
            
            // Verificar si el usuario tiene alguno de los roles permitidos
            const hasPermission = allowedRoles.some(allowedRole => 
              userRoles.some(userRole => roleMatches(userRole, allowedRole)) ||
              roleMatches(userProfile.tipo, allowedRole)
            );
            
            console.log('  ¿Tiene permiso?:', hasPermission);
            
            if (hasPermission) {
              setIsAuthorized(true);
            } else {
              // Usuario no tiene el rol requerido, redirigir según el tipo de usuario
              const redirectPath = getRedirectPath(userProfile.tipo, userRoles);
              console.log('  ❌ Redirigiendo a:', redirectPath);
              router.push(redirectPath);
            }
          } else {
            router.push('/login');
          }
        } catch (error) {
          console.error('Error verificando autenticación:', error);
          router.push('/login');
        }
      } else {
        // No se especificaron roles, solo verificar que esté autenticado
        setIsAuthorized(true);
      }
    };

    checkAuth();
  }, [router, allowedRoles]);

  // Mientras se verifica la autorización, no mostrar nada
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si está autorizado, mostrar el contenido
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Si no está autorizado, no mostrar nada (ya se redirigió)
  return null;
} 