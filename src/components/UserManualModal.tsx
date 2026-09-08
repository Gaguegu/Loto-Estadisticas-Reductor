import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Printer,
  FileDown,
  Layers,
  BarChart3,
  Calendar,
  Sparkles,
  ShieldCheck,
  FolderHeart,
  Database,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import ansamaLogo from '../assets/images/ansama_lottery_logo_1788692658153.jpg';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrintManual: () => void;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({
  isOpen,
  onClose,
  onPrintManual,
}) => {
  const [activeTab, setActiveTab] = useState<'intro' | 'games' | 'stats' | 'reductions' | 'columns' | 'peñas' | 'sync' | 'tips'>('intro');

  if (!isOpen) return null;

  const sections = [
    { id: 'intro', label: '1. Introducción', icon: BookOpen },
    { id: 'games', label: '2. Juegos y Reglas', icon: Layers },
    { id: 'stats', label: '3. Filtros y Estadísticas', icon: BarChart3 },
    { id: 'reductions', label: '4. Reducciones Matemáticas', icon: Sparkles },
    { id: 'columns', label: '5. Visor y Escrutador', icon: ShieldCheck },
    { id: 'peñas', label: '6. Mis Peñas y Guardado', icon: FolderHeart },
    { id: 'sync', label: '7. Base de Datos Oficial', icon: Database },
    { id: 'tips', label: '8. Consejos y Estrategia', icon: HelpCircle },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={ansamaLogo}
              alt="Logo ANSAMA"
              className="w-10 h-10 object-contain rounded-xl bg-white p-0.5 border border-white/20 shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight text-white">
                  Manual de Usuario y Guía de Uso
                </h3>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  PDF Descargable
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Aprende a dominar las estadísticas, reducciones matemáticas y gestión de peñas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="manual-download-pdf-btn"
              onClick={onPrintManual}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
              title="Descargar o imprimir la guía completa en PDF"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar / Imprimir en PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title="Cerrar manual"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chapters Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-xs font-bold shrink-0 scrollbar-none">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 text-slate-800 text-sm leading-relaxed space-y-6">

          {/* CAPÍTULO 1: INTRODUCCIÓN */}
          {activeTab === 'intro' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
                <BookOpen className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-indigo-950 text-base">¿Qué es esta aplicación y cuál es su objetivo?</h4>
                  <p className="text-xs text-indigo-900/80 mt-1">
                    Es una plataforma profesional de <strong>análisis estadístico y optimización matemática</strong> para 
                    los principales sorteos de Loterías y Apuestas del Estado en España: <strong>La Primitiva, Bonoloto y Euromillones</strong>.
                  </p>
                </div>
              </div>

              <h4 className="text-base font-black text-slate-950 border-b pb-2">El problema de jugar al azar</h4>
              <p>
                Cuando juegas boletos sencillos con números al azar (o automáticos en ventanilla), la cobertura de tus combinaciones 
                es completamente dispersa y no ofrece ninguna garantía de arrastre de premios.
              </p>
              <p>
                Si tienes un grupo de <strong>12 números favoritos o con alta probabilidad estadística</strong>, jugar todas sus combinaciones 
                al directo costaría <strong>924 apuestas (924 € en Primitiva)</strong>. Esta aplicación utiliza 
                <strong> matrices reducidas combinatorias</strong> que te permiten jugar esos mismos 12 números por solo 
                <strong> 15 € (al 4) o 132 € (al 5)</strong>, asegurándote un 100% de premio si los números ganadores están dentro de tu grupo.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="font-black text-lg text-emerald-700">100% Oficial</div>
                  <div className="text-xs text-slate-600 mt-1">Sincronizado con resultados verificados de Loterías y Apuestas del Estado.</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="font-black text-lg text-blue-700">Garantía Matemática</div>
                  <div className="text-xs text-slate-600 mt-1">Reducciones homologadas con garantía matemática demostrada al 100%.</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="font-black text-lg text-amber-700">Escrutador en Vivo</div>
                  <div className="text-xs text-slate-600 mt-1">Comprueba al instante premios obtenidos contra sorteos históricos o en directo.</div>
                </div>
              </div>
            </div>
          )}

          {/* CAPÍTULO 2: JUEGOS Y REGLAS */}
          {activeTab === 'games' && (
            <div className="space-y-4">
              <h4 className="text-base font-black text-slate-950 border-b pb-2">Juegos Soportados y Horarios Oficiales</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Primitiva */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-emerald-950 text-base">La Primitiva</span>
                      <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">1,00 €</span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-emerald-900">
                      <li><strong>Sorteos:</strong> Lunes, Jueves y Sábado (21:40 h).</li>
                      <li><strong>Combinación:</strong> 6 números (del 1 al 49).</li>
                      <li><strong>Complementario:</strong> Para el premio de 5+C.</li>
                      <li><strong>Reintegro:</strong> Del 0 al 9 (devolución del boleto).</li>
                    </ul>
                  </div>
                  <div className="mt-3 text-[11px] text-emerald-800 bg-emerald-100/70 p-2 rounded-lg font-medium">
                    Reducción recomendada: 12 números al 5 (132 col.) o al 4 (15 col.).
                  </div>
                </div>

                {/* Bonoloto */}
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-blue-950 text-base">Bonoloto</span>
                      <span className="bg-blue-200 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded-full">0,50 €</span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-blue-900">
                      <li><strong>Sorteos:</strong> Diario (Lunes a Domingo a las 21:30 h).</li>
                      <li><strong>Combinación:</strong> 6 números (del 1 al 49).</li>
                      <li><strong>Complementario:</strong> Para el premio de 5+C.</li>
                      <li><strong>Reintegro:</strong> Del 0 al 9 (devolución del importe).</li>
                    </ul>
                  </div>
                  <div className="mt-3 text-[11px] text-blue-800 bg-blue-100/70 p-2 rounded-lg font-medium">
                    Misma matriz que Primitiva a la mitad de precio (ideal para peñas diarias).
                  </div>
                </div>

                {/* Euromillones */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-amber-950 text-base">Euromillones</span>
                      <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">2,50 €</span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-amber-900">
                      <li><strong>Sorteos:</strong> Martes y Viernes (21:30 h).</li>
                      <li><strong>Combinación:</strong> 5 números (1 al 50) + 2 Estrellas (1 al 12).</li>
                      <li><strong>Premios:</strong> 13 categorías (desde 2 números acertados).</li>
                      <li><strong>El Millón:</strong> Código asignado automáticamente.</li>
                    </ul>
                  </div>
                  <div className="mt-3 text-[11px] text-amber-800 bg-amber-100/70 p-2 rounded-lg font-medium">
                    Reducción optimizada de 10 números + 5 estrellas en 14 apuestas (35,00 €).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CAPÍTULO 3: FILTROS Y ESTADÍSTICAS */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <h4 className="text-base font-black text-slate-950 border-b pb-2">Cómo Utilizar los Filtros Estadísticos</h4>
              <p>
                En la barra superior de cada juego dispones del panel de <strong>Periodo y Filtros</strong>:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                  <h5 className="font-black text-slate-900 text-xs uppercase mb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-600" /> Presets de Periodo
                  </h5>
                  <ul className="text-xs space-y-1 text-slate-700">
                    <li><strong>Últimos 10 sorteos:</strong> Detecta las bolas con mayor inercia inmediata.</li>
                    <li><strong>Últimos 20 sorteos:</strong> Rango óptimo recomendado para detectar tendencias estables.</li>
                    <li><strong>Últimos 50 y 100 sorteos:</strong> Comportamiento a medio y largo plazo.</li>
                    <li><strong>Año Actual (2026):</strong> Toda la temporada actual.</li>
                    <li><strong>Todo el Histórico:</strong> Comportamiento global de las bolas desde el inicio de los registros.</li>
                    <li><strong>Personalizado:</strong> Elige fechas exactas desde y hasta en el calendario.</li>
                  </ul>
                </div>

                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                  <h5 className="font-black text-slate-900 text-xs uppercase mb-2 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-indigo-600" /> Columnas de la Tabla
                  </h5>
                  <ul className="text-xs space-y-1 text-slate-700">
                    <li><strong>Nº Bola:</strong> El número analizado con su color característico.</li>
                    <li><strong>Apariciones:</strong> Cuántas veces ha salido en el periodo seleccionado.</li>
                    <li><strong>Frecuencia (%):</strong> Porcentaje de sorteos en los que ha aparecido.</li>
                    <li><strong>Retraso Actual:</strong> Cuántos sorteos consecutivos lleva sin salir (números "fríos" o atrasados).</li>
                  </ul>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                💡 <strong>Consejo de Selección Rápida:</strong> Al cambiar de juego o periodo, la aplicación selecciona automáticamente 
                los 12 números más frecuentes (y las 5 mejores estrellas en Euromillones). Puedes personalizar la selección haciendo clic 
                sobre cualquier número para añadirlo o quitarlo a tu gusto.
              </div>
            </div>
          )}

          {/* CAPÍTULO 4: REDUCCIONES MATEMÁTICAS */}
          {activeTab === 'reductions' && (
            <div className="space-y-4">
              <h4 className="text-base font-black text-slate-950 border-b pb-2">El Poder de las Reducciones Matemáticas</h4>
              <p>
                Una <strong>reducción matemática</strong> consiste en seleccionar un conjunto amplio de números y combinarlos mediante una 
                matriz matemática optimizada, de manera que con un número muy pequeño de columnas se asegure al 100% una categoría mínima de premio.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="p-2.5 text-left">Garantía</th>
                      <th className="p-2.5 text-center">Apuestas</th>
                      <th className="p-2.5 text-center">Coste Primitiva</th>
                      <th className="p-2.5 text-center">Coste Bonoloto</th>
                      <th className="p-2.5 text-left">Garantía Asegurada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-slate-50 text-slate-500">
                      <td className="p-2.5 font-bold">Directo (sin reducción)</td>
                      <td className="p-2.5 text-center">924</td>
                      <td className="p-2.5 text-center">924,00 €</td>
                      <td className="p-2.5 text-center">462,00 €</td>
                      <td className="p-2.5">100% al 6 (Coste desorbitado)</td>
                    </tr>
                    <tr className="bg-emerald-50/70 font-bold text-emerald-950">
                      <td className="p-2.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Garantía al 5
                      </td>
                      <td className="p-2.5 text-center">132</td>
                      <td className="p-2.5 text-center">132,00 €</td>
                      <td className="p-2.5 text-center">66,00 €</td>
                      <td className="p-2.5 text-emerald-800">100% asegurado 5 aciertos (+14% opción de 6)</td>
                    </tr>
                    <tr className="bg-blue-50/70 font-bold text-blue-950">
                      <td className="p-2.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span> Garantía al 4
                      </td>
                      <td className="p-2.5 text-center">15</td>
                      <td className="p-2.5 text-center">15,00 €</td>
                      <td className="p-2.5 text-center">7,50 €</td>
                      <td className="p-2.5 text-blue-800">100% asegurado 4 aciertos (con opción de 5)</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold text-slate-800">
                      <td className="p-2.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-600"></span> Garantía al 3
                      </td>
                      <td className="p-2.5 text-center">4</td>
                      <td className="p-2.5 text-center">4,00 €</td>
                      <td className="p-2.5 text-center">2,00 €</td>
                      <td className="p-2.5 text-slate-700">100% asegurado 3 aciertos (inversión mínima)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-slate-600">
                <strong>¿Por qué jugar al 4 o al 5?</strong> Porque acertar 6 números entre 12 es un gran logro. Jugar al 5 garantiza que 
                cobrarás el premio de 5 aciertos (que suele ser de miles de euros) habiendo invertido únicamente 66 € en Bonoloto o 132 € en Primitiva.
              </p>
            </div>
          )}

          {/* CAPÍTULO 5: VISOR Y ESCRUTADOR */}
          {activeTab === 'columns' && (
            <div className="space-y-4">
              <h4 className="text-base font-black text-slate-950 border-b pb-2">El Visor de Columnas y el Escrutador en Directo</h4>
              <p>
                Al pulsar <strong>«Calcular Combinaciones Reducidas»</strong>, se despliega el visor con todas las apuestas desglosadas:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Escrutador Automático Histórico
                  </h5>
                  <p>
                    Te permite seleccionar cualquier sorteo oficial de la base de datos (por ejemplo, el último sorteo de ayer) 
                    y comprueba en milisegundos todas las columnas de tu combinación.
                  </p>
                  <p className="text-slate-600">
                    Los números acertados se resaltan con un círculo verde brillante y el panel superior te indica exactamente 
                    cuántos premios de 6, 5+C, 5, 4 y 3 aciertos has obtenido.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Escrutador Manual en Directo
                  </h5>
                  <p>
                    Durante la noche del sorteo, cuando aún no se ha publicado el acta oficial, puedes introducir manualmente los 
                    6 números ganadores (y complementario/reintegro) para comprobar tu jugada al instante mientras ves el sorteo por televisión o radio.
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-white text-xs space-y-1.5">
                <strong className="text-slate-900 block">Acciones disponibles en el visor:</strong>
                <p>• <strong>Copiar al Portapapeles:</strong> Copia el texto limpio con todas las columnas para enviarlas por WhatsApp o email a tu peña.</p>
                <p>• <strong>Imprimir Boletos / Papeleta:</strong> Formatea una hoja A4 con membrete oficial lista para imprimir o guardar en PDF.</p>
                <p>• <strong>Guardar en Mis Peñas:</strong> Guarda la combinación con un nombre personalizado para reutilizarla semana tras semana.</p>
              </div>
            </div>
          )}

          {/* CAPÍTULO 6: GESTIÓN DE PEÑAS */}
          {activeTab === 'peñas' && (
            <div className="space-y-4">
              <h4 className="text-base font-black text-slate-950 border-b pb-2">Gestión de Peñas y Combinaciones Habituales</h4>
              <p>
                Si juegas con familiares, amigos o en una peña de trabajo, la sección <strong>«Mis Peñas»</strong> te permite organizar 
                tus apuestas fijas:
              </p>

              <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700">
                <li>
                  <strong>Guardar una combinación:</strong> Una vez calculada la reducción, haz clic en el botón 
                  <strong> «Guardar en Mis Peñas»</strong>. Escribe un nombre representativo (ej. <em>"Peña Viernes Bonoloto 12 Números"</em>) 
                  y añade notas si lo deseas.
                </li>
                <li>
                  <strong>Consultar en cualquier momento:</strong> Pulsa el botón <strong>«Mis Peñas»</strong> en la cabecera para ver 
                  todas tus combinaciones guardadas clasificadas por juego.
                </li>
                <li>
                  <strong>Carga en 1 Clic:</strong> Pulsa <strong>«Cargar»</strong> para recuperar al instante todos los números y la reducción.
                </li>
                <li>
                  <strong>Escrutinio Directo:</strong> Pulsa <strong>«Escrutar»</strong> en la tarjeta de la peña y la aplicación comprobará 
                  automáticamente tu combinación guardada contra el último sorteo oficial celebrado.
                </li>
                <li>
                  <strong>Copias de Seguridad:</strong> Puedes exportar todas tus peñas en un archivo JSON para tener una copia de seguridad 
                  o importarlas en otro teléfono o navegador.
                </li>
              </ol>
            </div>
          )}

          {/* CAPÍTULO 7: SINCRONIZACIÓN OFICIAL */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <h4 className="text-base font-black text-slate-950 border-b pb-2">Base de Datos y Control de Sorteos Oficiales</h4>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                  <Database className="w-4 h-4 text-amber-700" /> Máxima Integridad de Datos (Sin números falsos ni fechas prematuras)
                </div>
                <p>
                  A diferencia de otros programas que generan combinaciones aleatorias inventadas, esta aplicación 
                  <strong> solo contiene y procesa sorteos oficiales verificados de Loterías y Apuestas del Estado</strong>.
                </p>
                <p>
                  <strong>Regla de Horario Oficial Español (CET/CEST):</strong> Los sorteos del día de hoy no se incorporan a la base de datos 
                  hasta que se celebran por la noche (21:30h Bonoloto y Euromillones, 21:40h Primitiva). Esto evita errores de fechas o sorteos anticipados.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <strong>Botón «Actualizar BD»:</strong> Si hay nuevos sorteos oficiales celebrados, un indicador amarillo te avisará. 
                  Al hacer clic se fusionan automáticamente en tu almacenamiento local.
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <strong>Historial de Sorteos:</strong> En el botón «Historial Sorteos» puedes ver todos los sorteos anteriores, ordenados 
                  por fecha y con acceso directo a la web oficial de Loterías y Apuestas del Estado.
                </div>
              </div>
            </div>
          )}

          {/* CAPÍTULO 8: CONSEJOS Y ESTRATEGIA */}
          {activeTab === 'tips' && (
            <div className="space-y-4">
              <h4 className="text-base font-black text-slate-950 border-b pb-2">Estrategias y Buenas Prácticas</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <strong className="text-slate-900 block text-sm font-bold">1. Equilibrio de Pares e Impares</strong>
                  <p className="text-slate-700">
                    Estadísticamente, en más del 80% de los sorteos se dan combinaciones equilibradas: <strong>3 pares y 3 impares</strong>, 
                    <strong> 4 pares y 2 impares</strong> o <strong>2 pares y 4 impares</strong>. Evita elegir 6 números todos pares o todos impares.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <strong className="text-slate-900 block text-sm font-bold">2. Suma Total de la Combinación</strong>
                  <p className="text-slate-700">
                    En La Primitiva y Bonoloto, la suma de los 6 números ganadores suele situarse en la campana de Gauss entre 
                    <strong> 120 y 180</strong>. El visor de columnas te muestra la suma media calculada de tu combinación.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <strong className="text-slate-900 block text-sm font-bold">3. Mezcla de Frecuentes y Retrasados</strong>
                  <p className="text-slate-700">
                    Una estrategia clásica consiste en seleccionar 8 o 9 números de la parte alta de la tabla de frecuencia ("calientes") 
                    y combinar 3 o 4 números con alto retraso histórico que estén a punto de romper su ciclo de ausencia.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <strong className="text-slate-900 block text-sm font-bold">4. Juego Responsable</strong>
                  <p className="text-slate-700">
                    Ningún método matemático puede garantizar el 100% de acertar el bote millonario. Las reducciones garantizan optimizar el coste 
                    y maximizar los premios secundarios. Juega siempre de forma responsable y con dinero destinado al ocio.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-slate-500 text-center sm:text-left">
            Pulsa en <strong>«Descargar / Imprimir en PDF»</strong> para guardar este manual como documento oficial en tu ordenador o móvil.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrintManual}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition active:scale-95 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir / Guardar como PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition active:scale-95 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
