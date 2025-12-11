const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
// Usar nuestro módulo personalizado en lugar del buggy docxtemplater-image-module
const CustomImageModule = require('../../utils/custom-image-module');

const { getInformeDownload } = require('../../models/reportes/docentes.model');

const generarInformeDocentes = async (filtros) => {
  try {
    console.log('Iniciando generación de informe...');
    console.log('Filtros recibidos:', filtros);
    
    // Obtener datos del modelo
    const datosDocentes = await getInformeDownload(filtros);
    console.log(`Total de docentes obtenidos: ${Array.isArray(datosDocentes) ? datosDocentes.length : 1}`);
    
    // Procesar datos para el template
    const datosParaTemplate = await procesarDatosParaTemplate(datosDocentes);
    
    console.log('Datos procesados para template:');
    console.log(`- Total docentes: ${datosParaTemplate.totalDocentes}`);
    console.log(`- Docentes con aspectos: ${datosParaTemplate.docentes.filter(d => d.tiene_aspectos).length}`);
    console.log(`- Docentes con gráfico: ${datosParaTemplate.docentes.filter(d => d.grafico_aspectos && d.grafico_aspectos.length > 0).length}`);
    
    // Leer el template
    const templatePath = path.join(__dirname, '../../templates/docentes.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    
    const zip = new PizZip(content);
    
    // Configurar módulo de imágenes con manejo robusto
    const imageOpts = {
      centered: false,
      fileType: 'docx',
      getImage: function (tagValue, tagName) {
        try {
          // Validar que tagValue sea un Buffer
          if (!tagValue || !Buffer.isBuffer(tagValue)) {
            console.log(`⚠️  Sin imagen válida para ${tagName}`);
            // Si no es un buffer, generar imagen transparente
            return generarImagenTransparente();
          }
          
          // Si es una imagen transparente pequeña (67-70 bytes), mantenerla
          // pero no la logueamos como válida
          if (tagValue.length >= 67 && tagValue.length <= 70) {
            // No loguear, es la imagen transparente para docentes sin gráfico
            return tagValue;
          }
          
          console.log(`✅ Imagen válida para ${tagName}, tamaño: ${tagValue.length} bytes`);
          return tagValue;
        } catch (error) {
          console.error(`❌ Error en getImage para ${tagName}:`, error);
          return generarImagenTransparente();
        }
      },
      getSize: function (img, tagValue, tagName) {
        try {
          // Si no hay imagen válida, usar tamaño mínimo (invisible)
          if (!img || !tagValue || !Buffer.isBuffer(tagValue)) {
            return [1, 1]; // Tamaño mínimo en EMUs (prácticamente invisible)
          }
          
          // Si es la imagen transparente de 1x1 píxel (67-70 bytes), usar tamaño mínimo
          if (tagValue.length >= 67 && tagValue.length <= 70) {
            // Tamaño mínimo para que no se vea (1 EMU = aprox 0.000001 pulgadas)
            return [1, 1];
          }
          
          // Para gráficos reales, usar tamaño completo
          // Aproximadamente 6.25" x 4.17" (600x400 px a 96 DPI)
          return [5715000, 3810000]; // ancho x alto en EMUs
        } catch (error) {
          console.error(`❌ Error en getSize para ${tagName}:`, error);
          return [1, 1];
        }
      }
    };
    
    // Crear el módulo de imágenes personalizado (sin bugs de scope)
    const imageModule = new CustomImageModule(imageOpts);
    
    // Configurar Docxtemplater con manejo robusto de errores
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [imageModule],
      // nullGetter se llama cuando una propiedad es null o undefined
      nullGetter: function(part, scopeManager) {
        if (!part) return null;
        
        const partValue = part.value || 'unknown';
        const partModule = part.module || 'none';
        
        // Para el módulo de imágenes, retornar null explícitamente
        // Esto permite que el módulo de imágenes lo maneje correctamente
        if (partModule === 'docxtemplater-image-module' || partValue === 'grafico_aspectos') {
          console.log(`ℹ️  Imagen null/undefined para: ${partValue}`);
          return null;
        }
        
        // Para otros valores, retornar string vacío
        return '';
      }
    });
    
    console.log('Renderizando documento...');
    
    // Debug: Verificar la estructura de datos antes de renderizar
    console.log('📋 Verificando estructura de datos:');
    console.log(`- Total docentes en datosParaTemplate: ${datosParaTemplate.docentes.length}`);
    datosParaTemplate.docentes.forEach((doc, idx) => {
      const hasGrafico = doc.hasOwnProperty('grafico_aspectos');
      const isBuffer = hasGrafico && Buffer.isBuffer(doc.grafico_aspectos);
      const bufferSize = isBuffer ? doc.grafico_aspectos.length : 0;
      const tieneAspectos = doc.tiene_aspectos || false;
      console.log(`  [${idx}] ${doc.DOCENTE || doc.NOMBRE_DOCENTE || 'N/A'}: tiene_aspectos=${tieneAspectos}, grafico_aspectos=${hasGrafico ? 'EXISTS' : 'NO'}, isBuffer=${isBuffer}, size=${bufferSize}`);
    });
    
    // Renderizar el documento con try-catch específico
    try {
      doc.render(datosParaTemplate);
    } catch (renderError) {
      console.error('❌ Error durante doc.render():', renderError.message);
      console.error('Stack trace:', renderError.stack);
      
      // Si es un error de docxtemplater, intentar dar más información
      if (renderError.properties) {
        console.error('📋 Detalles del error:');
        console.error('  - id:', renderError.properties.id);
        console.error('  - explanation:', renderError.properties.explanation);
        if (renderError.properties.scope) {
          console.error('  - scope:', JSON.stringify(renderError.properties.scope, null, 2));
        }
        console.error('  - offset:', renderError.properties.offset);
      }
      
      // Proporcionar sugerencias
      console.error('\n💡 POSIBLES CAUSAS:');
      console.error('  1. La plantilla Word tiene {%grafico_aspectos} fuera del loop {#docentes}');
      console.error('  2. Hay un error de sintaxis en la plantilla Word');
      console.error('  3. La plantilla referencia una propiedad que no existe en los datos');
      console.error('\n📝 SOLUCIÓN RECOMENDADA:');
      console.error('  Verifica que la plantilla docentes.docx tenga esta estructura:');
      console.error('  {#docentes}');
      console.error('    ...datos del docente...');
      console.error('    {#tiene_aspectos}');
      console.error('      {%grafico_aspectos}');
      console.error('    {/tiene_aspectos}');
      console.error('  {/docentes}');
      
      throw renderError;
    }
    
    console.log('Generando archivo ZIP...');
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });
    
    console.log(`✅ Informe generado exitosamente: ${(buf.length / 1024).toFixed(2)} KB`);
    return buf;
    
  } catch (error) {
    console.error('Error generando informe:', error);
    if (error.properties) {
      console.error('Detalles del error:', JSON.stringify(error.properties, null, 2));
    }
    throw error;
  }
};

/**
 * Genera una imagen PNG transparente de 1x1 píxel (mínima posible)
 * Se usa para docentes sin gráfico, permitiendo que la plantilla siempre tenga una imagen
 * @returns {Buffer} Buffer de imagen PNG transparente
 */
const generarImagenTransparente = () => {
  // PNG transparente 1x1 píxel (el más pequeño posible: 67 bytes)
  // Este es un PNG válido que no se verá en el documento
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return Buffer.from(pngBase64, 'base64');
};

const procesarDatosParaTemplate = async (datosOriginales) => {
  // Asegurarse de que datosOriginales sea un array
  const docentes = Array.isArray(datosOriginales) ? datosOriginales : [datosOriginales];
  
  // Procesar cada docente
  const docentesProcesados = await Promise.all(docentes.map(async (docente) => {
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
        puntaje_formateado: formatearPuntaje(aspecto.PUNTAJE_PROMEDIO),
        // Asegurar que descripcion exista (puede ser null en la BD)
        descripcion: aspecto.descripcion || 'Sin descripción disponible'
      })) : [];

    // Generar gráfico de barras para el docente
    let graficoBuffer = null;
    if (aspectosP.length > 0) {
      graficoBuffer = await generarGraficoDocente(docente, aspectosP);
    }

    // Validar si hay gráfico válido
    const tieneGraficoValido = graficoBuffer && graficoBuffer.length > 100; // Mínimo 100 bytes para un gráfico real
    
    if (tieneGraficoValido) {
      console.log(`✓ Gráfico agregado para: ${docente.DOCENTE || docente.ID_DOCENTE}`);
    } else {
      console.log(`⚠️  Sin gráfico para: ${docente.DOCENTE || docente.ID_DOCENTE}`);
    }

    // Construir el objeto del docente de forma explícita
    // IMPORTANTE: SIEMPRE incluir grafico_aspectos con una imagen válida
    // Para docentes sin gráfico, usar una imagen transparente de 1x1 píxel
    const docenteProcesado = {
      // Copiar todas las propiedades originales
      ...docente,
      // Sobrescribir/agregar propiedades procesadas
      asignaturas: asignaturasP,
      aspectos_evaluacion: aspectosP,
      // CRÍTICO: Siempre true para evitar bug del módulo de imágenes dentro de condicionales
      // La imagen transparente se renderizará con tamaño 1x1 (invisible)
      tiene_aspectos: true,
      // Guardar si realmente tiene aspectos para mostrar el detalle
      tiene_aspectos_detalle: tieneGraficoValido,
      // SIEMPRE incluir grafico_aspectos con una imagen PNG válida
      // Si no hay gráfico real, usar imagen transparente 1x1 que no se verá
      grafico_aspectos: tieneGraficoValido ? graficoBuffer : generarImagenTransparente()
    };
    
    return docenteProcesado;
  }));
  
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

/**
 * Genera un gráfico de barras para visualizar los aspectos evaluados de un docente
 * Utiliza QuickChart.io para generar el gráfico (compatible con Windows sin compilación nativa)
 * @param {Object} docente - Datos del docente
 * @param {Array} aspectos - Array de aspectos evaluados
 * @returns {Buffer} - Buffer de la imagen del gráfico
 */
const generarGraficoDocente = async (docente, aspectos) => {
  try {
    const https = require('https');
    
    // Preparar datos para el gráfico
    const labels = aspectos.map(a => {
      const nombre = a.ASPECTO || a.aspecto || 'Sin nombre';
      // Truncar nombres muy largos
      return nombre.length > 40 ? nombre.substring(0, 40) + '...' : nombre;
    });
    
    const data = aspectos.map(a => {
      const puntaje = a.PUNTAJE_PROMEDIO || 0;
      return parseFloat((puntaje * 100).toFixed(1)); // Convertir a porcentaje
    });

    // Definir colores según el rendimiento
    const backgroundColors = data.map(value => {
      if (value >= 90) return 'rgba(34, 197, 94, 0.8)'; // Verde (excelente)
      if (value >= 80) return 'rgba(59, 130, 246, 0.8)'; // Azul (bueno)
      if (value >= 70) return 'rgba(250, 204, 21, 0.8)'; // Amarillo (regular)
      if (value >= 60) return 'rgba(251, 146, 60, 0.8)'; // Naranja (mejorable)
      return 'rgba(239, 68, 68, 0.8)'; // Rojo (bajo)
    });

    const borderColors = backgroundColors.map(color => color.replace('0.8', '1'));

    // Configuración del gráfico para QuickChart
    const chartConfig = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Puntaje (%)',
          data: data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        indexAxis: 'y', // Barras horizontales
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Evaluación por Aspectos - ${docente.DOCENTE || docente.NOMBRE_DOCENTE || 'Docente'}`,
            font: {
              size: 18,
              weight: 'bold'
            },
            color: '#1f2937',
            padding: {
              top: 10,
              bottom: 20
            }
          },
          legend: {
            display: false
          },
          datalabels: {
            anchor: 'end',
            align: 'end',
            formatter: (value) => value + '%',
            color: '#374151',
            font: {
              weight: 'bold',
              size: 11
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              },
              font: {
                size: 12
              },
              color: '#4b5563'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false
            },
            title: {
              display: true,
              text: 'Puntaje Promedio (%)',
              font: {
                size: 14,
                weight: 'bold'
              },
              color: '#374151'
            }
          },
          y: {
            ticks: {
              font: {
                size: 11
              },
              color: '#4b5563'
            },
            grid: {
              display: false,
              drawBorder: false
            }
          }
        },
        layout: {
          padding: {
            left: 10,
            right: 20,
            top: 10,
            bottom: 10
          }
        }
      }
    };

    // Crear URL de QuickChart
    const chartConfigEncoded = encodeURIComponent(JSON.stringify(chartConfig));
    const width = 800;
    const height = Math.max(400, aspectos.length * 60); // Altura dinámica según número de aspectos
    const url = `https://quickchart.io/chart?width=${width}&height=${height}&backgroundColor=white&chart=${chartConfigEncoded}`;

    // Descargar la imagen desde QuickChart
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          console.error(`Error descargando gráfico: ${response.statusCode}`);
          resolve(null);
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log(`✅ Gráfico generado para ${docente.DOCENTE || docente.NOMBRE_DOCENTE || 'docente'} (${buffer.length} bytes)`);
          resolve(buffer);
        });
      }).on('error', (error) => {
        console.error('Error descargando gráfico:', error);
        resolve(null);
      });
    });

  } catch (error) {
    console.error('Error generando gráfico para docente:', error);
    return null;
  }
};

module.exports = {
  generarInformeDocentes
};