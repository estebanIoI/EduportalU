"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { rolesService } from "@/services/evaluacionITP/auth/roles.service";
import { userRolesService } from "@/services/evaluacionITP/auth/userRoles.service";
import { Roles, UserRoles } from "@/lib/types/evaluacionInsitu";
import { RolesView } from "./components/views/RolesView";
import { UserRolesView } from "./components/views/UserRolesView";
import { ModalRol } from "./components/modals/ModalRol";
import { ModalUserRol } from "./components/modals/ModalUserRol";
import { ModalConfirmacion } from "./components/modals/ModalConfirmacion";

export default function RolesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("roles");
  const [roles, setRoles] = useState<Roles[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para modales de Roles
  const [modalRol, setModalRol] = useState({
    isOpen: false,
    rol: undefined as Roles | undefined,
  });

  // Estados para modales de UserRoles
  const [modalUserRol, setModalUserRol] = useState({
    isOpen: false,
    userRol: undefined as UserRoles | undefined,
  });

  const [modalConfirmacion, setModalConfirmacion] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  });

  // Cargar datos iniciales
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const [rolesResponse, userRolesResponse] = await Promise.all([
        rolesService.getAll(),
        userRolesService.getAll()
      ]);
      
      // Extract data from API responses
      setRoles(rolesResponse.data || []);
      setUserRoles(userRolesResponse.data || []);
    } catch (error) {
      console.error("❌ Error al cargar datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cargarRoles = async () => {
    try {
      const rolesResponse = await rolesService.getAll();
      setRoles(rolesResponse.data || []);
    } catch (error) {
      console.error("❌ Error al cargar roles:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los roles",
        variant: "destructive",
      });
    }
  };

  const cargarUserRoles = async () => {
    try {
      const userRolesResponse = await userRolesService.getAll();
      setUserRoles(userRolesResponse.data || []);
    } catch (error) {
      console.error("❌ Error al cargar roles de usuario:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los roles de usuario",
        variant: "destructive",
      });
    }
  };

  // Handlers para Roles
  const handleEliminarRol = async (rol: Roles) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Rol",
      description: `¿Está seguro de eliminar el rol "${rol.NOMBRE_ROL}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await rolesService.delete(rol.ID);
          await cargarRoles();
          toast({
            title: "¡Eliminación exitosa!",
            description: `El rol "${rol.NOMBRE_ROL}" se eliminó correctamente`,
          });
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || "No se pudo eliminar el rol";
          toast({
            title: "Error al eliminar",
            description: errorMessage,
            variant: "destructive",
          });
          throw error;
        }
      },
    });
  };

  // Handlers para UserRoles
  const handleEliminarUserRol = async (userRol: UserRoles) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Asignación de Rol",
      description: `¿Está seguro de eliminar la asignación del rol "${userRol.role_name}" para el usuario ID ${userRol.user_id}? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await userRolesService.delete(userRol.id);
          await cargarUserRoles();
          toast({
            title: "¡Eliminación exitosa!",
            description: `La asignación de rol se eliminó correctamente`,
          });
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || "No se pudo eliminar la asignación";
          toast({
            title: "Error al eliminar",
            description: errorMessage,
            variant: "destructive",
          });
          throw error;
        }
      },
    });
  };

  const handleCerrarModalRol = () => {
    setModalRol({ isOpen: false, rol: undefined });
  };

  const handleCerrarModalUserRol = () => {
    setModalUserRol({ isOpen: false, userRol: undefined });
  };

  const handleCerrarModalConfirmacion = () => {
    setModalConfirmacion({
      ...modalConfirmacion,
      isOpen: false,
    });
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">Cargando datos...</span>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Gestión de Roles</h1>
          <p className="text-gray-600">Administre los roles del sistema y las asignaciones de usuarios</p>
        </div>

        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === "roles" ? "default" : "outline"}
            onClick={() => setActiveTab("roles")}
          >
            Roles del Sistema
          </Button>
          <Button
            variant={activeTab === "userRoles" ? "default" : "outline"}
            onClick={() => setActiveTab("userRoles")}
          >
            Asignaciones de Usuario
          </Button>
        </div>

        {activeTab === "roles" && (
          <RolesView
            roles={roles}
            setModalRol={setModalRol}
            handleEliminarRol={handleEliminarRol}
          />
        )}

        {activeTab === "userRoles" && (
          <UserRolesView
            userRoles={userRoles}
            setModalUserRol={setModalUserRol}
            handleEliminarUserRol={handleEliminarUserRol}
          />
        )}

        {/* Modales */}

        <ModalRol
          isOpen={modalRol.isOpen}
          onClose={handleCerrarModalRol}
          rol={modalRol.rol}
          onSuccess={cargarRoles}
        />

        <ModalUserRol
          isOpen={modalUserRol.isOpen}
          onClose={handleCerrarModalUserRol}
          userRol={modalUserRol.userRol}
          onSuccess={cargarUserRoles}
        />

        <ModalConfirmacion
          isOpen={modalConfirmacion.isOpen}
          onClose={handleCerrarModalConfirmacion}
          title={modalConfirmacion.title}
          description={modalConfirmacion.description}
          onConfirm={modalConfirmacion.onConfirm}
        />
      </div>
    </ProtectedRoute>
  );
}