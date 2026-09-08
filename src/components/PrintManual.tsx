import React from 'react';
import ansamaLogo from '../assets/images/ansama_lottery_logo_1788692658153.jpg';

export const PrintManual: React.FC = () => {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="print-only hidden print:block text-slate-900 bg-white font-sans max-w-4xl mx-auto p-8 text-xs leading-relaxed">
      {/* Portada / Header de Documento */}
      <div className="border-b-4 border-slate-900 pb-6 mb-8 flex items-center justify-between gap-6">
        <img
          src={ansamaLogo}
          alt="ANSAMA Lotería"
          className="w-20 h-20 object-contain rounded-2xl border border-slate-300 p-1"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1 text-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            DOCUMENTACIÓN OFICIAL Y MANUAL DE USO
          </span>
          <h1 className="text-2xl font-black uppercase tracking-wide text-slate-950 mt-2">
            LOTO ESTADÍSTICAS & REDUCCIONES PRO
          </h1>
          <p className="text-xs font-semibold text-slate-700 uppercase mt-0.5">
            Manual de Usuario y Guía de Sistemas Reducidos (La Primitiva, Bonoloto, Euromillones)
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Fecha de Emisión: {currentDate} &bull; Edición 2026</p>
        </div>
        <div className="text-right border-l-2 border-slate-200 pl-4">
          <span className="block text-[10px] text-slate-400 font-bold uppercase">Software</span>
          <span className="font-black text-sm text-slate-800">ANSAMA v2.6</span>
          <span className="block text-[9px] text-emerald-700 font-semibold mt-1">Sistemas Certificados</span>
        </div>
      </div>

      {/* Resumen Ejecutivo */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-1">
          Resumen Ejecutivo
        </h2>
        <p className="text-slate-700 text-[11px] leading-relaxed">
          Esta aplicación profesional está diseñada para optimizar las probabilidades de acierto en los juegos oficiales de 
          <strong> Loterías y Apuestas del Estado (La Primitiva, Bonoloto y Euromillones)</strong>. Combina el análisis 
          estadístico de sorteos reales verificados (frecuencias, retrasos y sumas) con algoritmos matemáticos de 
          <strong> combinaciones reducidas con garantía de premio</strong>, permitiendo a jugadores particulares y peñas 
          jugar muchos más números por una fracción mínima del coste de una jugada directa al directo.
        </p>
      </div>

      {/* ÍNDICE DE CONTENIDOS */}
      <div className="mb-8 border border-slate-200 rounded-xl p-4 bg-white">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 border-b pb-1">
          Índice del Manual
        </h3>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div><strong>1.</strong> Introducción y Filosofía del Sistema</div>
          <div><strong>5.</strong> Visor de Columnas y Escrutador en Vivo</div>
          <div><strong>2.</strong> Juegos y Reglas Oficiales</div>
          <div><strong>6.</strong> Gestión de Peñas y Guardado</div>
          <div><strong>3.</strong> Filtros Temporales y Análisis Estadístico</div>
          <div><strong>7.</strong> Base de Datos y Sincronización Oficial</div>
          <div><strong>4.</strong> Sistemas de Reducción Matemática</div>
          <div><strong>8.</strong> Consejos Estratégicos y Juego Responsable</div>
        </div>
      </div>

      {/* CAPÍTULO 1 */}
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">
          1. Introducción y Filosofía del Sistema
        </h3>
        <p className="text-slate-700 mb-2">
          En los juegos de azar de combinación pura (como 6 de 49 en Primitiva/Bonoloto o 5 de 50 en Euromillones), 
          jugar números al azar o boletos simples dispersos no garantiza ninguna cobertura matemática.
        </p>
        <p className="text-slate-700 mb-2">
          El objetivo de esta herramienta es doble:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700 pl-2">
          <li><strong>Detección de tendencias y frecuencias:</strong> Permite filtrar el historial en distintos periodos (últimos 10, 20, 50, 100 sorteos o histórico completo) para localizar los números más repetidos ("números calientes") y los que acumulan mayor retraso.</li>
          <li><strong>Optimización de costes mediante Reducciones:</strong> Jugar 12 números directos en Primitiva requeriría pagar 924 apuestas (924 €). Con un sistema reducido al 5, se cubren esos mismos 12 números jugando únicamente <strong>132 apuestas (132 €)</strong> o al 4 jugando solo <strong>15 apuestas (15 €)</strong>, con una garantía matemática del 100% de obtener premio si los números ganadores están en el grupo seleccionado.</li>
        </ul>
      </div>

      {/* CAPÍTULO 2 */}
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">
          2. Los Juegos y sus Reglas Oficiales
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            <h4 className="font-black text-emerald-900 text-xs mb-1">LA PRIMITIVA</h4>
            <p><strong>Días:</strong> Lunes, Jueves y Sábados (21:40h).</p>
            <p><strong>Números:</strong> 6 números del 1 al 49.</p>
            <p><strong>Complementario:</strong> Para el premio de 5+C.</p>
            <p><strong>Reintegro:</strong> Del 0 al 9 (devolución).</p>
            <p><strong>Precio oficial:</strong> 1,00 € por columna.</p>
          </div>
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            <h4 className="font-black text-blue-900 text-xs mb-1">BONOLOTO</h4>
            <p><strong>Días:</strong> Diario (Lunes a Domingo a las 21:30h).</p>
            <p><strong>Números:</strong> 6 números del 1 al 49.</p>
            <p><strong>Complementario:</strong> Para el premio de 5+C.</p>
            <p><strong>Reintegro:</strong> Del 0 al 9 (devolución).</p>
            <p><strong>Precio oficial:</strong> 0,50 € por columna.</p>
          </div>
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            <h4 className="font-black text-amber-900 text-xs mb-1">EUROMILLONES</h4>
            <p><strong>Días:</strong> Martes y Viernes (21:30h).</p>
            <p><strong>Números:</strong> 5 números del 1 al 50.</p>
            <p><strong>Estrellas:</strong> 2 estrellas del 1 al 12.</p>
            <p><strong>Premios:</strong> 13 categorías (desde 2 números).</p>
            <p><strong>Precio oficial:</strong> 2,50 € por apuesta (incluye El Millón).</p>
          </div>
        </div>
      </div>

      {/* CAPÍTULO 3 */}
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">
          3. Filtros Temporales y Análisis Estadístico
        </h3>
        <p className="text-slate-700 mb-2">
          La tabla de frecuencias clasifica automáticamente cada bola de mayor a menor número de apariciones.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
            <strong className="block text-slate-900 mb-1">Filtros Rápidos Disponibles:</strong>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700">
              <li><strong>Últimos 10 sorteos:</strong> Tendencia inmediata.</li>
              <li><strong>Últimos 20 sorteos:</strong> Periodo estándar recomendado.</li>
              <li><strong>Últimos 50 y 100 sorteos:</strong> Medio y largo plazo.</li>
              <li><strong>Año Actual (2026):</strong> Rendimiento anual.</li>
              <li><strong>Todo el Histórico:</strong> Comportamiento global de las bolas.</li>
              <li><strong>Rango Personalizado:</strong> Fechas exactas a elección.</li>
            </ul>
          </div>
          <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
            <strong className="block text-slate-900 mb-1">Métricas calculadas por bola:</strong>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700">
              <li><strong>Apariciones (Nº):</strong> Veces que ha salido en el periodo.</li>
              <li><strong>Frecuencia (%):</strong> Porcentaje sobre el total de sorteos.</li>
              <li><strong>Retraso actual:</strong> Sorteos transcurridos desde su última salida.</li>
              <li><strong>Suma media y par/impar:</strong> Indicadores de balance.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CAPÍTULO 4 */}
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">
          4. Sistemas de Reducción Matemática y Garantías
        </h3>
        <p className="text-slate-700 mb-2">
          ¿Qué significa jugar una reducción con garantía?
        </p>
        <p className="text-slate-700 mb-2">
          Si seleccionas 12 números y la combinación ganadora oficial contiene 6 de esos 12 números:
        </p>
        <table className="w-full border-collapse border border-slate-300 text-[10px] mb-3">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="border border-slate-300 p-1.5 text-left">Garantía del Sistema</th>
              <th className="border border-slate-300 p-1.5 text-center">Apuestas</th>
              <th className="border border-slate-300 p-1.5 text-center">Coste Primitiva</th>
              <th className="border border-slate-300 p-1.5 text-center">Coste Bonoloto</th>
              <th className="border border-slate-300 p-1.5 text-left">Garantía Matemática Asegurada</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 p-1.5 font-bold">Juego Directo al Directo</td>
              <td className="border border-slate-300 p-1.5 text-center">924</td>
              <td className="border border-slate-300 p-1.5 text-center">924,00 €</td>
              <td className="border border-slate-300 p-1.5 text-center">462,00 €</td>
              <td className="border border-slate-300 p-1.5">100% al 6 (Coste prohibitivo)</td>
            </tr>
            <tr className="bg-emerald-50">
              <td className="border border-slate-300 p-1.5 font-bold text-emerald-950">Garantía al 5 (132 col.)</td>
              <td className="border border-slate-300 p-1.5 text-center font-bold">132</td>
              <td className="border border-slate-300 p-1.5 text-center font-bold">132,00 €</td>
              <td className="border border-slate-300 p-1.5 text-center font-bold">66,00 €</td>
              <td className="border border-slate-300 p-1.5"><strong>100% asegurado 5 aciertos</strong> (y 14% de probabilidad de 6)</td>
            </tr>
            <tr className="bg-blue-50">
              <td className="border border-slate-300 p-1.5 font-bold text-blue-950">Garantía al 4 (15 col.)</td>
              <td className="border border-slate-300 p-1.5 text-center font-bold">15</td>
              <td className="border border-slate-300 p-1.5 text-center font-bold">15,00 €</td>
              <td className="border border-slate-300 p-1.5 text-center font-bold">7,50 €</td>
              <td className="border border-slate-300 p-1.5"><strong>100% asegurado 4 aciertos</strong> (con alto porcentaje de 5)</td>
            </tr>
            <tr className="bg-slate-50">
              <td className="border border-slate-300 p-1.5 font-bold">Garantía al 3 (4 col.)</td>
              <td className="border border-slate-300 p-1.5 text-center font-bold">4</td>
              <td className="border border-slate-300 p-1.5 text-center font-bold">4,00 €</td>
              <td className="border border-slate-300 p-1.5 text-center font-bold">2,00 €</td>
              <td className="border border-slate-300 p-1.5"><strong>100% asegurado 3 aciertos</strong> (mínima inversión)</td>
            </tr>
          </tbody>
        </table>
        <p className="text-[10px] text-slate-500 italic">
          * En Euromillones el sistema reduce 10 números + 5 estrellas en 14 columnas (garantía al 4) o 6 columnas (garantía al 3).
        </p>
      </div>

      {/* CAPÍTULO 5 */}
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">
          5. Visor de Columnas y Escrutador en Vivo
        </h3>
        <p className="text-slate-700 mb-2">
          Una vez calculada la reducción, el visor muestra todas las combinaciones generadas de forma ordenada:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700 pl-2">
          <li><strong>Escrutador Histórico Automático:</strong> Puedes elegir cualquier fecha del historial para comprobar cuántos premios habría obtenido tu jugada contra ese sorteo real. Las bolas acertadas se iluminan en verde brillante.</li>
          <li><strong>Escrutador Manual en Directo:</strong> Durante la noche del sorteo, introduce los 6 números que acaban de salir por televisión o radio para ver en menos de 1 segundo todas las columnas premiadas.</li>
          <li><strong>Copiar al Portapapeles:</strong> Copia todas las columnas en texto limpio para compartirlas por WhatsApp, Telegram o correo a los miembros de tu peña.</li>
          <li><strong>Imprimir Boletos / Resguardo:</strong> Genera un resguardo imprimible con membrete y desglose oficial.</li>
        </ul>
      </div>

      {/* CAPÍTULO 6 */}
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">
          6. Gestión de Peñas y Combinaciones Guardadas
        </h3>
        <p className="text-slate-700 mb-2">
          Puedes guardar cualquier combinación reducida para no tener que volver a configurarla:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-2">
          <li>En el visor de columnas, haz clic en <strong>«Guardar en Mis Peñas»</strong>.</li>
          <li>Asigna un nombre a la jugada (ej. <em>"Peña Los Amigos - Jueves"</em>) y notas opcionales.</li>
          <li>Accede en cualquier momento desde el botón <strong>«Mis Peñas»</strong> en la cabecera.</li>
          <li>Con un solo clic puedes <strong>cargarla de nuevo</strong> o <strong>escrutarla directamente</strong> contra el último sorteo celebrado.</li>
          <li>Dispones de opciones para <strong>exportar copia de seguridad en JSON</strong> o importar jugadas en cualquier otro ordenador o teléfono.</li>
        </ol>
      </div>

      {/* CAPÍTULO 7 */}
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">
          7. Base de Datos y Sincronización Oficial
        </h3>
        <p className="text-slate-700 mb-2">
          La base de datos utiliza información verídica y contrastada de Loterías y Apuestas del Estado:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700 pl-2">
          <li><strong>Control Horario Oficial Español (CET):</strong> Los sorteos del día en curso (que se celebran a las 21:30h / 21:40h) están rigurosamente bloqueados durante el día. Jamás se generan números simulados o inventados.</li>
          <li><strong>Botón «Actualizar BD»:</strong> Comprueba si hay sorteos oficiales celebrados pendientes de incorporar a tu navegador y los fusiona en milisegundos.</li>
          <li><strong>Historial Completo:</strong> Puedes consultar todos los sorteos anteriores con sus combinaciones, complementarios, reintegros y estrellas.</li>
        </ul>
      </div>

      {/* CAPÍTULO 8 */}
      <div className="mb-4">
        <h3 className="text-sm font-black uppercase text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">
          8. Consejos Estratégicos y Juego Responsable
        </h3>
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-slate-800 text-[11px] space-y-1">
          <p><strong>1. Balance Par / Impar:</strong> Más del 80% de las combinaciones ganadoras contienen repartos 3P-3I, 4P-2I o 2P-4I. Evita combinaciones de 6 números todos pares o todos impares.</p>
          <p><strong>2. Rango de Sumas Ideal:</strong> En Primitiva y Bonoloto, la suma de los 6 números ganadores se sitúa estadísticamente entre 120 y 180 en la inmensa mayoría de sorteos.</p>
          <p><strong>3. Ventaja de Peñas:</strong> Compartir el coste de una reducción al 5 (132 € o 66 € en Bonoloto) entre varios jugadores maximiza enormemente el retorno manteniendo una inversión individual muy reducida.</p>
          <p><strong>4. Juego Responsable:</strong> Los juegos de lotería son actividades de entretenimiento. Juega siempre con moderación y dentro de tus posibilidades presupuestarias.</p>
        </div>
      </div>

      {/* Pie de Documento */}
      <div className="border-t-2 border-slate-900 pt-3 mt-6 flex items-center justify-between text-[10px] text-slate-500">
        <div>ANSAMA Software de Loterías &bull; Documentación Técnica de Usuario</div>
        <div>Edición Oficial 2026 &bull; Página 1 de 1 (Resumen Completo)</div>
      </div>
    </div>
  );
};
