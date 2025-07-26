const {
  getCount,
  getDocentesAsignaturasModel,
  getEstudiantesEvaluadosModel,
  getAspectosPuntajeModel,
  getComentariosModel,
} = require("../../models/reportes/docentes.model");

class DocentesService {
  static async getDocentesAsignaturas(filters, pagination) {
    const {
      idConfiguracion,
      periodo,
      nombreSede,
      nomPrograma,
      semestre,
      grupo
    } = filters;

    const docentes = await getDocentesAsignaturasModel({
      idConfiguracion,
      periodo,
      nombreSede,
      nomPrograma,
      semestre,
      grupo,
      pagination
    });

    const totalCount = await getCount({
      idConfiguracion,
      periodo,
      nombreSede,
      nomPrograma,
      semestre,
      grupo
    });

    return {
      data: docentes,
      totalCount
    };
  }

  static async getEstudiantesEvaluados(idDocente, codAsignatura, grupo) {
    // Validar parámetros requeridos
    if (!idDocente || !codAsignatura || !grupo) {
      throw new Error("Faltan parámetros requeridos: idDocente, codAsignatura y grupo");
    }

    const estudiantes = await getEstudiantesEvaluadosModel(
      idDocente,
      codAsignatura,
      grupo
    );

    if (!estudiantes) {
      throw new Error("No se encontraron estudiantes evaluados para los parámetros proporcionados");
    }

    return estudiantes;
  }

  static async getAspectosPuntaje(filters) {
  const {
    idDocente,  
    idConfiguracion,
    periodo,
    nombreSede,
    nomPrograma,
    semestre,
    grupo
  } = filters;

  // Validar parámetro requerido
  if (!idDocente) {
    throw new Error("El parámetro idDocente es requerido");
  }

  const aspectos = await getAspectosPuntajeModel({
    idDocente, 
    idConfiguracion,
    periodo,
    nombreSede,
    nomPrograma,
    semestre,
    grupo
  });

  if (!aspectos || aspectos.length === 0) {
    throw new Error("No se encontraron aspectos y puntajes para el docente especificado");
  }

  return aspectos;
  }

  static async getComentarios(idDocente) {
    // Validar parámetro requerido
    if (!idDocente) {
      throw new Error("El parámetro idDocente es requerido");
    }

    const comentarios = await getComentariosModel(idDocente);

    if (!comentarios || comentarios.length === 0) {
      throw new Error("No se encontraron comentarios para el docente especificado");
    }

    return comentarios;
  }
}

module.exports = DocentesService;