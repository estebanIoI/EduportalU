// src/api/v1/controllers/vistaAcademica.controller.js
const VistaAcademicaModel = require('../../models/vista/vistaAcademica.model');

const getVistaAcademica = async (req, res, next) => {
  try {
    const { ID_DOCENTE, COD_ASIGNATURA, GRUPO, PERIODO } = req.query;
    
    // Si hay filtros, usar el método con filtros
    if (ID_DOCENTE || COD_ASIGNATURA || GRUPO) {
      const filters = {};
      if (ID_DOCENTE) filters.ID_DOCENTE = ID_DOCENTE;
      if (COD_ASIGNATURA) filters.COD_ASIGNATURA = COD_ASIGNATURA;
      if (GRUPO) filters.GRUPO = GRUPO;
      if (PERIODO) filters.PERIODO = PERIODO;
      
      console.log('getVistaAcademica - Filtros aplicados:', filters);
      const vistaAcademica = await VistaAcademicaModel.getVistaAcademicaFiltered(filters);
      return res.status(200).json({ success: true, data: vistaAcademica });
    }
    
    // Sin filtros, devolver todo (comportamiento original)
    const vistaAcademica = await VistaAcademicaModel.getAllVistaAcademica();
    return res.status(200).json({ success: true, data: vistaAcademica });
  } catch (error) {
    next(error);
  }
};

const getVistaAcademicaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vistaAcademica = await VistaAcademicaModel.getVistaAcademicaById(id);
    
    if (!vistaAcademica || vistaAcademica.length === 0) {
      return res.status(404).json({ success: false, message: 'Vista Académica no encontrada' });
    }
    
    return res.status(200).json({ success: true, data: vistaAcademica });
  } catch (error) {
    next(error);
  }
};

// ENDPOINT PARA OBTENER OPCIONES DISPONIBLES SEGÚN FILTROS APLICADOS
const getOpcionesFiltros = async (req, res, next) => {
  try {
    const { 
      periodo, 
      sede, 
      programa, 
      semestre 
    } = req.query;

    console.log('getOpcionesFiltros - Parámetros recibidos:', { periodo, sede, programa, semestre });

    // Validar que periodo sea obligatorio
    if (!periodo) {
      return res.status(400).json({ 
        success: false, 
        message: 'El parámetro "periodo" es obligatorio' 
      });
    }

    // Construir filtros aplicados
    const filters = { periodo };
    if (sede) filters.sede = sede;
    if (programa) filters.programa = programa;
    if (semestre) filters.semestre = semestre;

    console.log('Filtros construidos:', filters);

    // Obtener opciones disponibles para el siguiente nivel
    const opciones = await VistaAcademicaModel.getOpcionesFiltros(filters);
    
    console.log('Opciones obtenidas en controller:', JSON.stringify(opciones, null, 2));
    
    return res.status(200).json({ 
      success: true, 
      data: opciones,
      filters_applied: filters
    });
  } catch (error) {
    console.error('Error en getOpcionesFiltros:', error);
    next(error);
  }
};

// Mantener endpoints existentes para compatibilidad
const getPeriodos = async (req, res, next) => {
  try {
    const periodos = await VistaAcademicaModel.getPeriodos();
    return res.status(200).json({ success: true, data: periodos });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al obtener los periodos', error: err.message });
  }
};

const getSedes = async (req, res, next) => {
  try {
    console.log('Obteniendo sedes...');
    const sedes = await VistaAcademicaModel.getSedes();
    console.log('Sedes obtenidas en controller:', JSON.stringify(sedes, null, 2));
    return res.status(200).json({ success: true, data: sedes });  
  } catch (err) {
    console.error('Error en getSedes controller:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener las sedes', error: err.message });
  }
};

const getProgramas = async (req, res, next) => {
  try {
    const programas = await VistaAcademicaModel.getProgramas();
    return res.status(200).json({ success: true, data: programas }); 
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al obtener los programas', error: err.message });
  }
};

const getSemestres = async (req, res, next) => {
  try {
    const semestres = await VistaAcademicaModel.getSemestres();
    return res.status(200).json({ success: true, data: semestres });  
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al obtener los semestres', error: err.message });
  }
};

const getGrupos = async (req, res, next) => {
  try {
    const grupos = await VistaAcademicaModel.getGrupos();
    return res.status(200).json({ success: true, data: grupos }); 
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al obtener los grupos', error: err.message });
  }
};

module.exports = {
  getVistaAcademica,
  getVistaAcademicaById,
  getOpcionesFiltros,       // NUEVO
  getPeriodos,
  getSedes,
  getProgramas,
  getSemestres,
  getGrupos
};