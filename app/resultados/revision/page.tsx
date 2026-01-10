"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PreguntaUI, RespuestaUsuario } from "@/types/pregunta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Filter,
  BookOpen,
  FileText,
  Download,
  PieChart,
  TrendingUp,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

type FilterType = "all" | "correct" | "incorrect" | "area";

interface TestData {
  preguntas: PreguntaUI[];
  respuestas: RespuestaUsuario[];
  tipo: string;
  area?: string;
  disciplina?: string;
}

export default function RevisionPage() {
  const router = useRouter();
  const [testData, setTestData] = useState<TestData | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    // Obtener datos desde sessionStorage
    const sessionData = sessionStorage.getItem("session_test_data");

    if (!sessionData) {
      // Si no hay datos, redirigir al inicio
      router.push("/dashboard");
      return;
    }

    const data: TestData = JSON.parse(sessionData);
    setTestData(data);
  }, [router]);

  if (!testData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          <p className="text-base sm:text-lg text-muted-foreground animate-pulse">
            Cargando revisión...
          </p>
        </div>
      </div>
    );
  }

  const { preguntas, respuestas } = testData;

  // Calcular estadísticas
  const totalPreguntas = preguntas.length;
  let correctas = 0;
  let incorrectas = 0;

  const preguntasConRespuestas = preguntas.map((pregunta) => {
    const respuestaUsuario = respuestas.find(
      (r) => r.preguntaId === pregunta.id
    );
    const opcionCorrecta = pregunta.opciones.find((o) => o.es_correcta);
    const opcionUsuario = pregunta.opciones.find(
      (o) => o.clave === respuestaUsuario?.respuestaSeleccionada
    );
    const esCorrecta = opcionUsuario?.es_correcta || false;

    if (esCorrecta) {
      correctas++;
    } else {
      incorrectas++;
    }

    return {
      pregunta,
      respuestaUsuario,
      opcionCorrecta,
      opcionUsuario,
      esCorrecta,
    };
  });

  // Calcular estadísticas por área
  const porArea: { [key: string]: { correctas: number; total: number } } = {};
  preguntas.forEach((pregunta) => {
    const respuestaUsuario = respuestas.find(
      (r) => r.preguntaId === pregunta.id
    );
    const opcionCorrecta = pregunta.opciones.find((o) => o.es_correcta);
    const esCorrecta =
      respuestaUsuario?.respuestaSeleccionada === opcionCorrecta?.clave;

    const areaName = pregunta.componentes?.nombre || "General";
    if (!porArea[areaName]) {
      porArea[areaName] = { correctas: 0, total: 0 };
    }
    porArea[areaName].total++;
    if (esCorrecta) porArea[areaName].correctas++;
  });

  const resultadosPorArea = Object.entries(porArea).map(([area, stats]) => ({
    area,
    correctas: stats.correctas,
    total: stats.total,
    porcentaje: (stats.correctas / stats.total) * 100,
  }));

  const porcentaje = (correctas / totalPreguntas) * 100;

  // Filtrar preguntas según el filtro seleccionado
  const preguntasFiltradas = preguntasConRespuestas.filter((item) => {
    if (filter === "correct") return item.esCorrecta;
    if (filter === "incorrect") return !item.esCorrecta;
    return true;
  });

  // Función para generar y descargar PDF usando print del navegador
  const generarReporte = () => {
    setIsGeneratingPDF(true);

    try {
      const reporteHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Revisión - EduSentri</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 40px;
      text-align: center;
      margin-bottom: 30px;
      border-radius: 10px;
    }
    .logo {
      width: 80px;
      height: auto;
      margin-bottom: 20px;
    }
    .header h1 { 
      font-size: 32px; 
      margin-bottom: 10px;
      font-weight: 700;
    }
    .header p { 
      opacity: 0.95; 
      font-size: 16px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      text-align: center;
      padding: 20px;
      border-radius: 10px;
      border: 2px solid #e5e7eb;
      background: #f9fafb;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .stat-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #6b7280;
      font-weight: 600;
    }
    .stat-card.total .stat-value { color: #374151; }
    .stat-card.correct .stat-value { color: #10b981; }
    .stat-card.incorrect .stat-value { color: #ef4444; }
    .stat-card.score .stat-value { color: #8b5cf6; }
    
    .question-card {
      margin-bottom: 25px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
      page-break-inside: avoid;
      background: white;
    }
    .question-card.correct { 
      border-color: #86efac;
      background: #f0fdf4;
    }
    .question-card.incorrect { 
      border-color: #fca5a5;
      background: #fef2f2;
    }
    .question-header {
      padding: 20px;
      border-bottom: 2px solid #e5e7eb;
      display: flex;
      align-items: flex-start;
      gap: 15px;
    }
    .question-card.correct .question-header { 
      background: #dcfce7;
      border-bottom-color: #86efac;
    }
    .question-card.incorrect .question-header { 
      background: #fee2e2;
      border-bottom-color: #fca5a5;
    }
    .question-icon {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-weight: bold;
      font-size: 16px;
    }
    .question-card.correct .question-icon {
      background: #10b981;
      color: white;
    }
    .question-card.incorrect .question-icon {
      background: #ef4444;
      color: white;
    }
    .question-content { flex: 1; }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge.number { background: #1f2937; color: white; }
    .badge.component { background: #ddd6fe; color: #5b21b6; }
    .badge.difficulty-difícil { background: #fecaca; color: #b91c1c; }
    .badge.difficulty-media { background: #fed7aa; color: #c2410c; }
    .badge.difficulty-fácil { background: #d1fae5; color: #065f46; }
    .question-title {
      font-size: 16px;
      font-weight: 600;
      line-height: 1.6;
      color: #111827;
    }
    .question-body { padding: 20px; }
    .options { margin-bottom: 20px; }
    .option {
      padding: 12px 15px;
      margin-bottom: 10px;
      border-radius: 8px;
      border: 2px solid #e5e7eb;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      position: relative;
      background: white;
    }
    .option.correct {
      background: #dcfce7;
      border-color: #86efac;
    }
    .option.incorrect {
      background: #fee2e2;
      border-color: #fca5a5;
    }
    .option.user-answer::before {
      content: '👤 TU RESPUESTA';
      position: absolute;
      top: -10px;
      left: 10px;
      background: #3b82f6;
      color: white;
      padding: 3px 10px;
      border-radius: 5px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .option.user-answer {
      margin-top: 15px;
    }
    .option-key {
      font-weight: 800;
      font-size: 15px;
      flex-shrink: 0;
      min-width: 25px;
    }
    .option.correct .option-key { color: #059669; }
    .option.incorrect .option-key { color: #dc2626; }
    .option-text { 
      flex: 1;
      font-size: 14px;
      line-height: 1.6;
    }
    .option.correct .option-text { color: #065f46; }
    .option.incorrect .option-text { color: #991b1b; }
    .option-icon {
      font-size: 16px;
      flex-shrink: 0;
      margin-left: auto;
      font-weight: bold;
    }
    .option.correct .option-icon { color: #059669; }
    .option.incorrect .option-icon { color: #dc2626; }
    .explanation {
      background: #dbeafe;
      border: 2px solid #93c5fd;
      border-radius: 8px;
      padding: 15px;
      margin-top: 15px;
    }
    .explanation-title {
      font-weight: 700;
      font-size: 12px;
      color: #1e40af;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .explanation-text {
      color: #1e3a8a;
      font-size: 13px;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      padding: 30px;
      background: #f9fafb;
      border-top: 3px solid #e5e7eb;
      margin-top: 30px;
      border-radius: 10px;
    }
    .footer p {
      color: #6b7280;
      font-size: 13px;
      margin: 5px 0;
    }
    .footer strong {
      color: #374151;
      font-weight: 700;
    }
    .no-print {
      text-align: center;
      margin-bottom: 20px;
      padding: 20px;
      background: #f0f9ff;
      border: 2px solid #3b82f6;
      border-radius: 10px;
    }
    .no-print h2 {
      color: #1e40af;
      margin-bottom: 10px;
    }
    .no-print p {
      color: #1e3a8a;
      margin-bottom: 15px;
    }
    .print-btn {
      background: #10b981;
      color: white;
      border: none;
      padding: 12px 30px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      margin-right: 10px;
    }
    .print-btn:hover {
      background: #059669;
    }
    .close-btn {
      background: #6b7280;
      color: white;
      border: none;
      padding: 12px 30px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
    }
    .close-btn:hover {
      background: #4b5563;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      body { padding: 10px; }
      .header {
        padding: 20px;
        border-radius: 8px;
      }
      .header h1 { font-size: 24px; }
      .header p { font-size: 14px; }
      .stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .stat-card { padding: 15px; }
      .stat-value { font-size: 24px; }
      .stat-label { font-size: 10px; }
      .question-card { margin-bottom: 15px; }
      .question-header {
        padding: 15px;
        flex-direction: column;
        gap: 10px;
      }
      .question-icon {
        width: 24px;
        height: 24px;
        font-size: 14px;
      }
      .badges { gap: 6px; }
      .badge {
        font-size: 10px;
        padding: 3px 8px;
      }
      .question-title { font-size: 14px; }
      .question-body { padding: 15px; }
      .option {
        padding: 10px 12px;
        flex-direction: column;
        gap: 8px;
      }
      .option-key { min-width: auto; }
      .option-text { font-size: 13px; }
      .option.user-answer::before {
        font-size: 8px;
        padding: 2px 8px;
      }
      .explanation { padding: 12px; }
      .explanation-title { font-size: 11px; }
      .explanation-text { font-size: 12px; }
      .print-btn, .close-btn {
        padding: 10px 20px;
        font-size: 14px;
        display: block;
        width: 100%;
        margin: 5px 0;
      }
      .footer { padding: 20px; }
    }
    
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
      .question-card { page-break-inside: avoid; }
      .header { border-radius: 0; }
      .footer { border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="no-print">
      <h2>📄 Guardar como PDF</h2>
      <img src="${window.location.origin}/logo.png" width="100" height="100" alt="logo" />
      <p>Para guardar este reporte como PDF, haz clic en "Imprimir" y luego selecciona "Guardar como PDF" como destino.</p>
      <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
      <button class="close-btn" onclick="window.close()">❌ Cerrar</button>
    </div>
    
    <div class="header">
      <h1>📊 Reporte de Revisión de Examen</h1>
      <p>EduSentri - ${new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}</p>
    </div>
    
    <div class="stats">
      <div class="stat-card total">
        <div class="stat-value">${totalPreguntas}</div>
        <div class="stat-label">Total</div>
      </div>
      <div class="stat-card correct">
        <div class="stat-value">${correctas}</div>
        <div class="stat-label">Correctas</div>
      </div>
      <div class="stat-card incorrect">
        <div class="stat-value">${incorrectas}</div>
        <div class="stat-label">Incorrectas</div>
      </div>
      <div class="stat-card score">
        <div class="stat-value">${porcentaje.toFixed(0)}%</div>
        <div class="stat-label">Puntuación</div>
      </div>
    </div>
    
    <div class="content">
      ${preguntasConRespuestas
        .map(
          (item, index) => `
        <div class="question-card ${item.esCorrecta ? "correct" : "incorrect"}">
          <div class="question-header">
            <div class="question-icon">${item.esCorrecta ? "✓" : "✗"}</div>
            <div class="question-content">
              <div class="badges">
                <span class="badge number">Pregunta ${index + 1}</span>
                ${
                  item.pregunta.componentes?.nombre
                    ? `<span class="badge component">${item.pregunta.componentes.nombre}</span>`
                    : ""
                }
                ${
                  item.pregunta.dificultad
                    ? `<span class="badge difficulty-${item.pregunta.dificultad}">${item.pregunta.dificultad}</span>`
                    : ""
                }
              </div>
              <div class="question-title">${item.pregunta.enunciado}</div>
            </div>
          </div>
          <div class="question-body">
            <div class="options">
              ${item.pregunta.opciones
                .map((opcion) => {
                  const isUserAnswer =
                    opcion.clave ===
                    item.respuestaUsuario?.respuestaSeleccionada;
                  const isCorrectAnswer = opcion.es_correcta;
                  let classes = "option";
                  if (isCorrectAnswer) classes += " correct";
                  else if (isUserAnswer) classes += " incorrect";
                  if (isUserAnswer) classes += " user-answer";

                  return `
                  <div class="${classes}">
                    <span class="option-key">${opcion.clave})</span>
                    <span class="option-text">${opcion.texto}</span>
                    ${
                      isCorrectAnswer
                        ? '<span class="option-icon">✓</span>'
                        : ""
                    }
                    ${
                      isUserAnswer && !isCorrectAnswer
                        ? '<span class="option-icon">✗</span>'
                        : ""
                    }
                  </div>
                `;
                })
                .join("")}
            </div>
            ${
              item.pregunta.sustento
                ? `
              <div class="explanation">
                <div class="explanation-title">📚 Explicación</div>
                <div class="explanation-text">${item.pregunta.sustento}</div>
              </div>
            `
                : ""
            }
          </div>
        </div>
      `
        )
        .join("")}
    </div>
    
    <div class="footer">
      <p><strong>EduSentri</strong> - Sistema de Evaluación y Aprendizaje</p>
      <p>Generado el ${new Date().toLocaleString("es-ES")}</p>
      <img src="${window.location.origin}/logo.png" width="100" height="100" alt="logo" />
    </div>
  </div>
  
  <script>
    // Auto-trigger print dialog after page loads
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
    `;

      // Abrir nueva ventana con el reporte
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(reporteHTML);
        printWindow.document.close();
      } else {
        alert(
          "No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes."
        );
      }
    } catch (error) {
      console.error("Error al generar reporte:", error);
      alert(
        "Hubo un error al generar el reporte. Por favor, intenta nuevamente."
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 sm:py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <Button
            onClick={() => router.push("/resultados")}
            variant="ghost"
            className="mb-6 gap-2 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Resultados
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-linear-to-br from-primary to-purple-600 rounded-2xl shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Revisión Detallada
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Análisis completo de tu examen
                </p>
              </div>
            </div>
            <Button
              onClick={generarReporte}
              size="lg"
              disabled={isGeneratingPDF}
              className="gap-2 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Generar Reporte
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-8 border-none shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-700 delay-100 overflow-hidden">
          <div className="h-2 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600" />
          <CardContent className="pt-8 pb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="text-center p-5 rounded-2xl bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shadow-md hover:shadow-lg transition-shadow">
                <p className="text-3xl font-extrabold text-slate-700 dark:text-slate-200 mb-1">
                  {totalPreguntas}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  Total
                </p>
              </div>
              <div className="text-center p-5 rounded-2xl bg-linear-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-2 border-green-200 dark:border-green-800 shadow-md hover:shadow-lg transition-shadow">
                <p className="text-3xl font-extrabold text-green-700 dark:text-green-400 mb-1">
                  {correctas}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 uppercase tracking-wider font-semibold">
                  Correctas
                </p>
              </div>
              <div className="text-center p-5 rounded-2xl bg-linear-to-br from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-2 border-red-200 dark:border-red-800 shadow-md hover:shadow-lg transition-shadow">
                <p className="text-3xl font-extrabold text-red-700 dark:text-red-400 mb-1">
                  {incorrectas}
                </p>
                <p className="text-xs text-red-600 dark:text-red-500 uppercase tracking-wider font-semibold">
                  Incorrectas
                </p>
              </div>
              <div className="text-center p-5 rounded-2xl bg-linear-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900 border-2 border-purple-200 dark:border-purple-800 shadow-md hover:shadow-lg transition-shadow">
                <p className="text-3xl font-extrabold bg-linear-to-r from-purple-700 to-violet-700 dark:from-purple-400 dark:to-violet-400 bg-clip-text text-transparent mb-1">
                  {porcentaje.toFixed(0)}%
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-500 uppercase tracking-wider font-semibold">
                  Puntuación
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3 mb-8 animate-in fade-in slide-in-from-top-4 duration-700 delay-200">
          <Button
            onClick={() => setFilter("all")}
            variant={filter === "all" ? "default" : "outline"}
            size="default"
            className={`gap-2 transition-all ${
              filter === "all" ? "shadow-lg scale-105" : "hover:scale-105"
            }`}
          >
            <Filter className="w-4 h-4" />
            Todas ({totalPreguntas})
          </Button>
          <Button
            onClick={() => setFilter("correct")}
            variant={filter === "correct" ? "default" : "outline"}
            size="default"
            className={`gap-2 transition-all ${
              filter === "correct"
                ? "bg-green-600 hover:bg-green-700 shadow-lg scale-105"
                : "hover:scale-105 border-green-300 text-green-700 hover:bg-green-50"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Correctas ({correctas})
          </Button>
          <Button
            onClick={() => setFilter("incorrect")}
            variant={filter === "incorrect" ? "default" : "outline"}
            size="default"
            className={`gap-2 transition-all ${
              filter === "incorrect"
                ? "bg-red-600 hover:bg-red-700 shadow-lg scale-105"
                : "hover:scale-105 border-red-300 text-red-700 hover:bg-red-50"
            }`}
          >
            <XCircle className="w-4 h-4" />
            Incorrectas ({incorrectas})
          </Button>
          <Button
            onClick={() => setFilter("area")}
            variant={filter === "area" ? "default" : "outline"}
            size="default"
            className={`gap-2 transition-all ${
              filter === "area"
                ? "bg-purple-600 hover:bg-purple-700 shadow-lg scale-105"
                : "hover:scale-105 border-purple-300 text-purple-700 hover:bg-purple-50"
            }`}
          >
            <PieChart className="w-4 h-4" />
            Por Área
          </Button>
        </div>

        {/* View Content */}
        {filter === "area" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Card className="border shadow-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Desglose por Área
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {resultadosPorArea.map((area) => (
                    <div key={area.area} className="space-y-2">
                      <div className="flex justify-between items-end gap-4">
                        <span className="font-medium text-sm sm:text-base">
                          {area.area}
                        </span>
                        <div className="text-right">
                          <span
                            className={`text-sm font-bold ${
                              area.porcentaje >= 80
                                ? "text-green-600"
                                : area.porcentaje >= 60
                                ? "text-yellow-600"
                                : "text-orange-600"
                            }`}
                          >
                            {area.porcentaje.toFixed(0)}%
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({area.correctas}/{area.total})
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={area.porcentaje}
                        className="h-3 bg-slate-100 dark:bg-slate-800"
                        // indicatorClassName={
                        //   area.porcentaje >= 80
                        //     ? "bg-green-500"
                        //     : area.porcentaje >= 60
                        //     ? "bg-yellow-500"
                        //     : "bg-orange-500"
                        // }
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Questions List */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            {preguntasFiltradas.map((item, idx) => {
              const originalIndex = preguntasConRespuestas.indexOf(item);
              return (
                <Card
                  key={item.pregunta.id}
                  className={`border-none shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm ${
                    item.esCorrecta
                      ? "ring-2 ring-green-300 dark:ring-green-700"
                      : "ring-2 ring-red-300 dark:ring-red-700"
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div
                    className={`h-1.5 ${
                      item.esCorrecta
                        ? "bg-linear-to-r from-green-400 to-emerald-500"
                        : "bg-linear-to-r from-red-400 to-rose-500"
                    }`}
                  />
                  <CardHeader
                    className={`border-b-2 ${
                      item.esCorrecta
                        ? "bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800"
                        : "bg-linear-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`mt-1 p-2 rounded-xl ${
                          item.esCorrecta
                            ? "bg-green-500 shadow-lg shadow-green-500/30"
                            : "bg-red-500 shadow-lg shadow-red-500/30"
                        }`}
                      >
                        {item.esCorrecta ? (
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        ) : (
                          <XCircle className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold px-3 py-1">
                            Pregunta {originalIndex + 1}
                          </Badge>
                          {item.pregunta.componentes?.nombre && (
                            <Badge className="bg-purple-600 text-white hover:bg-purple-700 px-3 py-1">
                              {item.pregunta.componentes.nombre}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                          <span className="text-xm text-blue-600 font-bold">
                            {item.pregunta.num_pregunta}.{" "}
                          </span>
                          {item.pregunta.enunciado}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 pb-6 space-y-5">
                    {/* Opciones */}
                    <div className="space-y-3">
                      {item.pregunta.opciones.map((opcion) => {
                        const isUserAnswer =
                          opcion.clave ===
                          item.respuestaUsuario?.respuestaSeleccionada;
                        const isCorrectAnswer = opcion.es_correcta;

                        let bgClass = "bg-slate-50 dark:bg-slate-800/50";
                        let borderClass =
                          "border-slate-200 dark:border-slate-700";
                        let textClass = "text-slate-700 dark:text-slate-300";

                        if (isCorrectAnswer) {
                          bgClass =
                            "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40";
                          borderClass =
                            "border-green-400 dark:border-green-600";
                          textClass = "text-green-800 dark:text-green-200";
                        } else if (isUserAnswer && !isCorrectAnswer) {
                          bgClass =
                            "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40";
                          borderClass = "border-red-400 dark:border-red-600";
                          textClass = "text-red-800 dark:text-red-200";
                        }

                        return (
                          <div
                            key={opcion.clave}
                            className={`relative p-4 rounded-xl border-2 ${bgClass} ${borderClass} transition-all hover:scale-[1.01] ${
                              isUserAnswer ? "shadow-md" : ""
                            }`}
                          >
                            {isUserAnswer && (
                              <div className="absolute -top-2.5 left-3 px-3 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                                <span>Tu Respuesta</span>
                              </div>
                            )}
                            <div className="flex items-start gap-3">
                              <span
                                className={`font-extrabold text-lg ${textClass} min-w-[24px]`}
                              >
                                {opcion.clave})
                              </span>
                              <span
                                className={`${textClass} flex-1 leading-relaxed`}
                              >
                                {opcion.texto}
                              </span>
                              {isCorrectAnswer && (
                                <div className="p-1.5 bg-green-500 rounded-full shadow-md">
                                  <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <div className="p-1.5 bg-red-500 rounded-full shadow-md">
                                  <XCircle className="w-5 h-5 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Sustento/Explicación */}
                    {item.pregunta.sustento && (
                      <div className="mt-5 p-5 rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-300 dark:border-blue-800 shadow-inner">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">📚</span>
                          <p className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide">
                            Explicación
                          </p>
                        </div>
                        <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
                          {item.pregunta.sustento}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {preguntasFiltradas.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No hay preguntas que coincidan con el filtro seleccionado.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Bottom Navigation */}
        <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
          <Button
            onClick={() => router.push("/resultados")}
            variant="outline"
            size="lg"
            className="gap-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all border-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a Resultados
          </Button>
          <Button
            onClick={generarReporte}
            size="lg"
            className="gap-2 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            <Download className="w-5 h-5" />
            Descargar Reporte
          </Button>
        </div>
      </div>
    </div>
  );
}
