const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const { getInformeDownload } = require('../../models/reportes/docentes.model');

const generarInformeDocentes = async (filtros) => {
  try {
    console.log('Iniciando generación de informe...');
    
    // Obtener datos del modelo
    const datosDocentes = await getInformeDownload(filtros);
    
    // Procesar datos para el template
    const datosParaTemplate = procesarDatosParaTemplate(datosDocentes);
    
    // Leer el template
    const templatePath = path.join(__dirname, '../../templates/docentes.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    
    // Renderizar el documento
    doc.render(datosParaTemplate);
    
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });
    
    return buf;
    
  } catch (error) {
    console.error('Error generando informe:', error);
    throw error;
  }
};

const procesarDatosParaTemplate = (datosOriginales) => {
  // Asegurarse de que datosOriginales sea un array
  const docentes = Array.isArray(datosOriginales) ? datosOriginales : [datosOriginales];
  
  // Procesar cada docente
  const docentesProcesados = docentes.map(docente => {
    // Procesar asignaturas
    const asignaturasP = docente.asignaturas ? docente.asignaturas.map(asignatura => ({
      ...asignatura,
      // Procesar grupos con estados dinámicos
      grupos: asignatura.grupos ? asignatura.grupos.map(grupo => ({
        ...grupo,
        estado_grupo: determinarEstado(grupo.porcentaje_completado || 0)
      })) : []
    })) : [];

    // Procesar aspectos con formato mejorado
    const aspectosP = docente.aspectos_evaluacion ? 
      docente.aspectos_evaluacion.map(aspecto => ({
        ...aspecto,
        puntaje_formateado: formatearPuntaje(aspecto.PUNTAJE_PROMEDIO)
      })) : [];

    return {
      ...docente,
      asignaturas: asignaturasP,
      aspectos_evaluacion: aspectosP,
      // Determinar si tiene aspectos
      tiene_aspectos: aspectosP.length > 0
    };
  });
  
  // Calcular resumen
  const resumen = calcularResumen(docentesProcesados);
  
  return {
    docentes: docentesProcesados,
    totalDocentes: docentesProcesados.length,
    resumen: resumen,
    fechaGeneracion: new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  };
};

const determinarEstado = (porcentaje) => {
  if (porcentaje === 100) return 'COMPLETADO';
  if (porcentaje >= 75) return 'AVANZADO';
  if (porcentaje >= 50) return 'EN PROGRESO';
  if (porcentaje > 0) return 'INICIADO';
  return 'PENDIENTE';
};

const formatearPuntaje = (puntaje) => {
  if (typeof puntaje === 'number') {
    return `${(puntaje * 100).toFixed(1)}%`;
  }
  return 'N/A';
};

const calcularResumen = (docentes) => {
  const totalEsperadas = docentes.reduce((sum, d) => sum + (d.total_evaluaciones_esperadas || 0), 0);
  const totalCompletadas = docentes.reduce((sum, d) => sum + (d.evaluaciones_completadas || 0), 0);
  
  const docentesCompletos = docentes.filter(d => (d.porcentaje_completado || 0) === 100).length;
  const docentesProgreso = docentes.filter(d => {
    const porcentaje = d.porcentaje_completado || 0;
    return porcentaje > 0 && porcentaje < 100;
  }).length;
  const docentesPendientes = docentes.filter(d => (d.porcentaje_completado || 0) === 0).length;
  
  // Análisis de aspectos
  const docentesConAspectos = docentes.filter(d => d.aspectos_evaluacion && d.aspectos_evaluacion.length > 0);
  const totalAspectos = docentesConAspectos.reduce((sum, d) => sum + (d.aspectos_evaluacion?.length || 0), 0);
  
  // Aspectos más comunes
  const aspectosMap = {};
  docentes.forEach(docente => {
    if (docente.aspectos_evaluacion && docente.aspectos_evaluacion.length > 0) {
      docente.aspectos_evaluacion.forEach(aspecto => {
        const nombreAspecto = aspecto.ASPECTO || aspecto.aspecto || 'Sin nombre';
        if (aspectosMap[nombreAspecto]) {
          aspectosMap[nombreAspecto]++;
        } else {
          aspectosMap[nombreAspecto] = 1;
        }
      });
    }
  });
  
  const aspectosMasComunes = Object.entries(aspectosMap)
    .map(([aspecto, count]) => ({ aspecto, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5
  
  return {
    totalEsperadas,
    totalCompletadas,
    promedioCompletado: totalEsperadas > 0 ? ((totalCompletadas / totalEsperadas) * 100).toFixed(1) : '0',
    docentesCompletos,
    docentesProgreso,
    docentesPendientes,
    aspectos: {
      total_docentes_con_aspectos: docentesConAspectos.length,
      promedio_aspectos_por_docente: docentesConAspectos.length > 0 
        ? (totalAspectos / docentesConAspectos.length).toFixed(1) 
        : '0',
      aspectos_mas_comunes: aspectosMasComunes
    }
  };
};

module.exports = {
  generarInformeDocentes
};