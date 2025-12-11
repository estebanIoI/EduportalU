const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

// Leer la plantilla
const templatePath = path.join(__dirname, '../templates/docentes.docx');
const content = fs.readFileSync(templatePath, 'binary');

const zip = new PizZip(content);

// Crear un doc sin módulos para inspeccionar
const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
});

console.log('\n📄 INSPECCIÓN DE PLANTILLA docentes.docx\n');
console.log('='.repeat(60));

try {
  // Obtener todos los tags de la plantilla
  const tags = doc.getFullText();
  console.log('\n📝 Contenido de la plantilla (texto completo):\n');
  console.log(tags);
  console.log('\n' + '='.repeat(60));
  
  // Intentar compilar para ver estructura
  doc.compile();
  
  console.log('\n✅ La plantilla se compiló correctamente');
  console.log('\n📋 Tags detectados en la plantilla:');
  
  // Buscar patrones específicos
  const imageTagPattern = /{%[\w_]+}/g;
  const loopTagPattern = /{#[\w_]+}/g;
  const conditionalTagPattern = /{[\^#][\w_]+}/g;
  
  const imageTags = tags.match(imageTagPattern) || [];
  const loopTags = tags.match(loopTagPattern) || [];
  const conditionalTags = tags.match(conditionalTagPattern) || [];
  
  console.log('\n🖼️  Tags de imagen encontrados:', imageTags.length > 0 ? imageTags : 'Ninguno');
  console.log('🔄 Tags de loop encontrados:', loopTags.length > 0 ? loopTags : 'Ninguno');
  console.log('❓ Tags condicionales encontrados:', conditionalTags.length > 0 ? conditionalTags : 'Ninguno');
  
  // Buscar específicamente grafico_aspectos
  const graficoPattern = /\{[%#\/\^]?grafico_aspectos\}/g;
  const graficoTags = tags.match(graficoPattern) || [];
  
  console.log('\n🎯 Referencias a "grafico_aspectos":', graficoTags.length > 0 ? graficoTags : 'Ninguno');
  
  if (graficoTags.length > 0) {
    console.log('\n⚠️  ANÁLISIS DE PROBLEMA:');
    console.log('   El tag {%grafico_aspectos} se encontró en la plantilla');
    console.log('   Debe estar DENTRO de un condicional {#tiene_aspectos}..{/tiene_aspectos}');
    console.log('   O bien, TODOS los docentes deben tener la propiedad grafico_aspectos definida');
  }
  
  // Verificar estructura de loops
  const docentesLoopStart = tags.includes('{#docentes}');
  const docentesLoopEnd = tags.includes('{/docentes}');
  const tieneAspectosStart = tags.includes('{#tiene_aspectos}');
  const tieneAspectosEnd = tags.includes('{/tiene_aspectos}');
  
  console.log('\n🔍 Verificación de estructura:');
  console.log('   {#docentes} presente:', docentesLoopStart ? '✅' : '❌');
  console.log('   {/docentes} presente:', docentesLoopEnd ? '✅' : '❌');
  console.log('   {#tiene_aspectos} presente:', tieneAspectosStart ? '✅' : '❌');
  console.log('   {/tiene_aspectos} presente:', tieneAspectosEnd ? '✅' : '❌');
  
} catch (error) {
  console.error('\n❌ Error al inspeccionar plantilla:', error.message);
  if (error.properties) {
    console.error('\n📋 Detalles del error:');
    console.error(JSON.stringify(error.properties, null, 2));
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n💡 RECOMENDACIONES:\n');
console.log('1. La plantilla debe tener esta estructura:');
console.log('   {#docentes}');
console.log('     Nombre: {DOCENTE}');
console.log('     {#tiene_aspectos}');
console.log('       {%grafico_aspectos}');
console.log('     {/tiene_aspectos}');
console.log('   {/docentes}');
console.log('\n2. NUNCA usar {%grafico_aspectos} fuera de {#tiene_aspectos}');
console.log('\n3. Si se usa sin condicional, TODOS los docentes deben tener grafico_aspectos');
console.log('');
