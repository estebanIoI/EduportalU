// app/admin/formulario/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { 
  tiposEvaluacionService,
  configuracionEvaluacionService,
  aspectosEvaluacionService,
  escalasValoracionService,
  configuracionAspectoService,
  configuracionValoracionService,
  preguntasService,
  configuracionPreguntaService
} from "@/services";
import { TipoEvaluacion, AspectoEvaluacion, EscalaValoracion, ConfiguracionEvaluacion, Pregunta } from "@/lib/types/evaluacionInsitu";
import { ModalTipoEvaluacion } from "./components/ModalTipoEvaluacion";
import { ModalAspecto } from "./components/ModalAspecto";
import { ModalEscala } from "./components/ModalEscala";
import { ModalConfirmacion } from "./components/ModalConfirmacion";
import { ModalConfiguracionEvaluacion } from "./components/ModalConfiguracionEvaluacion";
import { ModalConfiguracionAspecto } from "./components/ModalConfiguracionAspecto";
import { ModalConfiguracionValoracion } from "./components/ModalConfiguracionValoracion";
import { ModalPregunta } from "./components/ModalPregunta";
import { ModalConfiguracionPregunta } from "./components/ModalConfiguracionPregunta";

// Importar las vistas separadas
import { TiposEvaluacionView } from "./components/views/TipoEvaluacionView";
import { ConfiguracionView } from "./components/views/ConfiguracionView";
import { AspectosView } from "./components/views/AspectosView";
import { EscalasView } from "./components/views/EscalasView";
import { EvaluacionView } from "./components/views/EvaluacionView";
import { PreguntasView } from "./components/views/PreguntasView";

export default function FormularioPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("configuracion");
  const [tiposEvaluacion, setTiposEvaluacion] = useState<TipoEvaluacion[]>([]);
  const [aspectos, setAspectos] = useState<AspectoEvaluacion[]>([]);
  const [escalas, setEscalas] = useState<EscalaValoracion[]>([]);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionEvaluacion[]>([]);
  const [modalConfiguracion, setModalConfiguracion] = useState({
    isOpen: false,
    configuracion: undefined as ConfiguracionEvaluacion | undefined,
  });

  // Estados para modales
  const [modalTipoEvaluacion, setModalTipoEvaluacion] = useState({
    isOpen: false,
    tipo: undefined as TipoEvaluacion | undefined,
  });

  const [modalAspecto, setModalAspecto] = useState({
    isOpen: false,
    aspecto: undefined as AspectoEvaluacion | undefined,
  });
  const [modalEscala, setModalEscala] = useState({
    isOpen: false,
    escala: undefined as EscalaValoracion | undefined,
  });
  const [modalPregunta, setModalPregunta] = useState({
    isOpen: false,
    pregunta: undefined as Pregunta | undefined,
  });
  const [modalConfirmacion, setModalConfirmacion] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  });

  const [configuracionSeleccionada, setConfiguracionSeleccionada] = useState<number | null>(null);
  const [configuracionAspectos, setConfiguracionAspectos] = useState<any[]>([]);
  const [configuracionValoraciones, setConfiguracionValoraciones] = useState<any[]>([]);
  const [configuracionPreguntas, setConfiguracionPreguntas] = useState<any[]>([]);
  const [modalConfiguracionAspecto, setModalConfiguracionAspecto] = useState({
    isOpen: false,
    configuracion: undefined as any | undefined,
  });
  const [modalConfiguracionValoracion, setModalConfiguracionValoracion] = useState({
    isOpen: false,
    configuracion: undefined as any | undefined,
  });
  const [modalConfiguracionPregunta, setModalConfiguracionPregunta] = useState({
    isOpen: false,
    configuracion: undefined as any | undefined,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      const [tiposResponse, aspectosResponse, escalasResponse, preguntasResponse, configuracionesResponse] = await Promise.all([
        tiposEvaluacionService.getAll(),
        aspectosEvaluacionService.getAll(),
        escalasValoracionService.getAll(),
        preguntasService.getAll(),
        configuracionEvaluacionService.getAll(),
      ]);
      
      // Extraer los datos de las respuestas de la API
      setTiposEvaluacion(tiposResponse.data || []);
      setAspectos(aspectosResponse.data || []);
      setEscalas(escalasResponse.data || []);
      setPreguntas(preguntasResponse.data || []);
      setConfiguraciones(configuracionesResponse.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos iniciales",
        variant: "destructive",
      });
    }
  };

  const cargarDatosFiltrados = async (configuracionId: number) => {
    try {
      const [responseConfig, responsePreguntas] = await Promise.all([
        tiposEvaluacionService.getConfiguracion(configuracionId),
        configuracionPreguntaService.getByConfiguracionId(configuracionId)
      ]);
      
      // Extraer los datos de la respuesta de la API
      const { configuracion, aspectos, valoraciones } = responseConfig.data || {};

      setConfiguracionAspectos(aspectos || []);
      setConfiguracionValoraciones(valoraciones || []);
      setConfiguracionPreguntas(responsePreguntas.data || []);

      toast({
        title: "Éxito",
        description: "Datos filtrados cargados correctamente",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos filtrados",
        variant: "destructive",
      });
    }
  };

  const handleEliminarTipoEvaluacion = async (tipo: TipoEvaluacion) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Tipo de Evaluación",
      description: `¿Está seguro de eliminar el tipo de evaluación "${tipo.NOMBRE}"?`,
      onConfirm: async () => {
        await tiposEvaluacionService.delete(tipo.ID);
        await cargarDatosIniciales();
      },
    });
  };

  const handleEliminarAspecto = async (aspecto: AspectoEvaluacion) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Aspecto",
      description: `¿Está seguro de eliminar el aspecto "${aspecto.ETIQUETA}"?`,
      onConfirm: async () => {
        await aspectosEvaluacionService.delete(aspecto.ID);
        await cargarDatosIniciales();
      },
    });
  };

  const handleEliminarEscala = async (escala: EscalaValoracion) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Escala",
      description: `¿Está seguro de eliminar la escala "${escala.ETIQUETA}"?`,
      onConfirm: async () => {
        await escalasValoracionService.delete(escala.ID);
        await cargarDatosIniciales();
      },
    });
  };

  const handleEliminarPregunta = async (pregunta: Pregunta) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Pregunta",
      description: `¿Está seguro de eliminar la pregunta "${pregunta.TEXTO}"?`,
      onConfirm: async () => {
        await preguntasService.delete(pregunta.ID);
        await cargarDatosIniciales();
      },
    });
  };

  const handleEliminarConfiguracion = async (configuracion: ConfiguracionEvaluacion) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Configuración",
      description: `¿Está seguro de eliminar esta configuración?`,
      onConfirm: async () => {
        await configuracionEvaluacionService.delete(configuracion.ID);
        await cargarDatosIniciales();
      },
    });
  };

  const handleEliminarConfiguracionAspecto = async (configuracion: ConfiguracionEvaluacion) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Configuración de Aspecto",
      description: `¿Está seguro de eliminar esta configuración de aspecto?`,
      onConfirm: async () => {
        await configuracionAspectoService.delete(configuracion.ID);
        await cargarDatosIniciales();
      },
    });
  };

  const handleEliminarConfiguracionValoracion = async (configuracion: ConfiguracionEvaluacion) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Configuración de Valoración",
      description: `¿Está seguro de eliminar esta configuración de valoración?`,
      onConfirm: async () => {
        await configuracionValoracionService.delete(configuracion.ID);
        await cargarDatosIniciales();
      },
    });
  };

  const handleEliminarConfiguracionPregunta = async (configuracion: ConfiguracionEvaluacion) => {
    setModalConfirmacion({
      isOpen: true,
      title: "Eliminar Configuración de Pregunta",
      description: `¿Está seguro de eliminar esta configuración de pregunta?`,
      onConfirm: async () => {
        await configuracionPreguntaService.delete(configuracion.ID);
        if (configuracionSeleccionada) {
          await cargarDatosFiltrados(configuracionSeleccionada);
        }
      },
    });
  };

  useEffect(() => {
    // Seleccionar automáticamente la primera configuración activa al cargar el componente
    if (configuraciones.length > 0) {
      const primeraActiva = configuraciones.find((config) => config.ACTIVO);
      if (primeraActiva) {
        setConfiguracionSeleccionada(primeraActiva.ID);
        cargarDatosFiltrados(primeraActiva.ID);
      }
    }
  }, [configuraciones]); // Ejecutar cuando las configuraciones cambien

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Gestión de Evaluaciones</h1>
          <p className="text-gray-600">Administre las configuraciones de evaluación</p>
        </div>

        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === "tiposEvaluacion" ? "default" : "outline"}
            onClick={() => setActiveTab("tiposEvaluacion")}
          >
            Tipos de Evaluación
          </Button>
          <Button
            variant={activeTab === "configuracion" ? "default" : "outline"}
            onClick={() => setActiveTab("configuracion")}
          >
            Configuración General
          </Button>
          <Button
            variant={activeTab === "aspectos" ? "default" : "outline"}
            onClick={() => setActiveTab("aspectos")}
          >
            Aspectos
          </Button>
          <Button
            variant={activeTab === "escalas" ? "default" : "outline"}
            onClick={() => setActiveTab("escalas")}
          >
            Escalas de Valoración
          </Button>
          <Button
            variant={activeTab === "preguntas" ? "default" : "outline"}
            onClick={() => setActiveTab("preguntas")}
          >
            Preguntas
          </Button>
          <Button
            variant={activeTab === "evaluacion" ? "default" : "outline"}
            onClick={() => setActiveTab("evaluacion")}
          >
            Evaluación
          </Button>
        </div>

        {activeTab === "tiposEvaluacion" && (
          <TiposEvaluacionView
            tiposEvaluacion={tiposEvaluacion}
            setModalTipoEvaluacion={setModalTipoEvaluacion}
            handleEliminarTipoEvaluacion={handleEliminarTipoEvaluacion}
            refreshTipos={cargarDatosIniciales}
          />
        )}

        {activeTab === "configuracion" && (
          <ConfiguracionView
            configuraciones={configuraciones}
            tiposEvaluacion={tiposEvaluacion}
            setModalConfiguracion={setModalConfiguracion}
            handleEliminarConfiguracion={handleEliminarConfiguracion}
            refreshConfiguracion={cargarDatosIniciales}
          />
        )}

        {activeTab === "aspectos" && (
          <AspectosView
            aspectos={aspectos}
            setModalAspecto={setModalAspecto}
            handleEliminarAspecto={handleEliminarAspecto}
          />
        )}

        {activeTab === "escalas" && (
          <EscalasView
            escalas={escalas}
            setModalEscala={setModalEscala}
            handleEliminarEscala={handleEliminarEscala}
          />
        )}

        {activeTab === "preguntas" && (
          <PreguntasView
            preguntas={preguntas}
            setModalPregunta={setModalPregunta}
            handleEliminarPregunta={handleEliminarPregunta}
          />
        )}

        {activeTab === "evaluacion" && (
          <EvaluacionView
            configuracionSeleccionada={configuracionSeleccionada}
            configuraciones={configuraciones}
            tiposEvaluacion={tiposEvaluacion}
            setConfiguracionSeleccionada={setConfiguracionSeleccionada}
            cargarDatosFiltrados={cargarDatosFiltrados}
            setModalConfiguracionAspecto={setModalConfiguracionAspecto}
            setModalConfiguracionValoracion={setModalConfiguracionValoracion}
            setModalConfiguracionPregunta={setModalConfiguracionPregunta}
            configuracionAspectos={configuracionAspectos}
            configuracionValoraciones={configuracionValoraciones}
            configuracionPreguntas={configuracionPreguntas}
            handleEliminarConfiguracionAspecto={handleEliminarConfiguracionAspecto}
            handleEliminarConfiguracionValoracion={handleEliminarConfiguracionValoracion}
            handleEliminarConfiguracionPregunta={handleEliminarConfiguracionPregunta}
            refreshAspectos={cargarDatosIniciales}
          />
        )}

        {/* Modales */}

        <ModalTipoEvaluacion
          isOpen={modalTipoEvaluacion.isOpen}
          onClose={() => setModalTipoEvaluacion({ isOpen: false, tipo: undefined })}
          tipo={modalTipoEvaluacion.tipo}
          onSuccess={cargarDatosIniciales}
        />  

        <ModalAspecto
          isOpen={modalAspecto.isOpen}
          onClose={() => setModalAspecto({ isOpen: false, aspecto: undefined })}
          aspecto={modalAspecto.aspecto}
          onSuccess={cargarDatosIniciales}
        />

        <ModalEscala
          isOpen={modalEscala.isOpen}
          onClose={() => setModalEscala({ isOpen: false, escala: undefined })}
          escala={modalEscala.escala}
          onSuccess={cargarDatosIniciales}
        />

        <ModalPregunta
          isOpen={modalPregunta.isOpen}
          onClose={() => setModalPregunta({ isOpen: false, pregunta: undefined })}
          pregunta={modalPregunta.pregunta}
          onSuccess={cargarDatosIniciales}
        />

        <ModalConfirmacion
          isOpen={modalConfirmacion.isOpen}
          onClose={() => setModalConfirmacion({ ...modalConfirmacion, isOpen: false })}
          title={modalConfirmacion.title}
          description={modalConfirmacion.description}
          onConfirm={modalConfirmacion.onConfirm}
        />

        <ModalConfiguracionEvaluacion
          isOpen={modalConfiguracion.isOpen}
          onClose={() => setModalConfiguracion({ isOpen: false, configuracion: undefined })}
          configuracion={modalConfiguracion.configuracion}
          onSuccess={cargarDatosIniciales}
        />

        <ModalConfiguracionAspecto
          isOpen={modalConfiguracionAspecto.isOpen}
          onClose={() => setModalConfiguracionAspecto({ isOpen: false, configuracion: undefined })}
          configuracion={modalConfiguracionAspecto.configuracion}
          configuracionEvaluacionId={configuracionSeleccionada!}
          onSuccess={() => cargarDatosFiltrados(configuracionSeleccionada!)}
        />

        <ModalConfiguracionValoracion
          isOpen={modalConfiguracionValoracion.isOpen}
          onClose={() => setModalConfiguracionValoracion({ isOpen: false, configuracion: undefined })}
          configuracion={modalConfiguracionValoracion.configuracion}
          configuracionEvaluacionId={configuracionSeleccionada!}
          onSuccess={() => cargarDatosFiltrados(configuracionSeleccionada!)}
        />

        <ModalConfiguracionPregunta
          isOpen={modalConfiguracionPregunta.isOpen}
          onClose={() => setModalConfiguracionPregunta({ isOpen: false, configuracion: undefined })}
          configuracion={modalConfiguracionPregunta.configuracion}
          configuracionEvaluacionId={configuracionSeleccionada!}
          onSuccess={() => cargarDatosFiltrados(configuracionSeleccionada!)}
        />
      </div>
    </ProtectedRoute>
  );
}