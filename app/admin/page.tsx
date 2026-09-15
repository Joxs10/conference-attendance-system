// app/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Conference {
  id: string;
  title: string;
  room: string;
  speakerId: string;
  startTime: string;
  endTime: string;
}

interface AttendanceLog {
  alumnoId: string;
  ultimoEstado: string;
  minutosAsistidos: number;
  totalMarcas: number;
  detalles?: { hora: string; tipo: string; dispositivo: string; }[];
}

export default function AdminPage() {
  const [conferencesList, setConferencesList] = useState<Conference[]>([]);
  const [selectedConfId, setSelectedConfId] = useState<string>("all");
  const [reportData, setReportData] = useState<AttendanceLog[]>([]);
  
  const [loadingConferences, setLoadingConferences] = useState<boolean>(true);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [isFormExpanded, setIsFormExpanded] = useState<boolean>(true);
  const [isConfDropdownOpen, setIsConfDropdownOpen] = useState<boolean>(false);
  const [expandedAlumnoId, setExpandedAlumnoId] = useState<string | null>(null);
  const [isTableExpanded, setIsTableExpanded] = useState<boolean>(true); 

  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');
  const [speakerId, setSpeakerId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // --- LÓGICA DEL GRÁFICO (ESTADO DERIVADO) ---
  const getChartData = () => {
    const counts = reportData.reduce((acc: any, curr) => {
      acc[curr.ultimoEstado] = (acc[curr.ultimoEstado] || 0) + 1;
      return acc;
    }, {});

    return [
      { name: 'En Sala (Puntual)', value: counts['ENTRADA'] || 0, color: '#10b981' }, 
      { name: 'En Sala (Tarde)', value: counts['TARDANZA'] || 0, color: '#f43f5e' }, 
      { name: 'En Sala (Retornó)', value: counts['RETORNO'] || 0, color: '#6366f1' }, 
      { name: 'Fuera (Salida Temp.)', value: counts['SALIDA_TEMPORAL'] || 0, color: '#f59e0b' }, 
    ].filter(item => item.value > 0);
  };

  // --- EXPORTAR A EXCEL (CSV) ---
  // --- EXPORTAR A EXCEL (CSV) OPTIMIZADO PARA LATINOAMÉRICA ---
  const handleDownloadCSV = () => {
    if (reportData.length === 0) return;

    // 1. Cabeceras del archivo (Usando PUNTO Y COMA en lugar de coma)
    let csvContent = "ID Alumno;Estado Actual;Tiempo Efectivo (min);Total de Escaneos\n";

    // 2. Llenar filas con datos (Separados por PUNTO Y COMA)
    reportData.forEach(row => {
      csvContent += `${row.alumnoId};${row.ultimoEstado};${row.minutosAsistidos};${row.totalMarcas}\n`;
    });

    // 3. Crear el archivo con prefijo BOM (\uFEFF) para forzar lectura correcta de tildes/UTF-8 en Excel
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Nombre dinámico para el archivo
    const confName = selectedConfId === 'all' ? 'Complemento_Total' : conferencesList.find(c => c.id === selectedConfId)?.title.replace(/\s+/g, '_') || 'Reporte';
    const dateStr = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Asistencia_${confName}_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await fetch('/api/status'); 
        const json = await res.json();
        if (json.success && json.data?.conferences) {
          setConferencesList(json.data.conferences);
        } else if (json.data && Array.isArray(json.data)) {
          setConferencesList(json.data);
        }
      } catch (err) {
        console.error("Error al sincronizar lista de ponencias:", err);
      } finally {
        setLoadingConferences(false);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function fetchReportData() {
      setLoadingReport(true);
      try {
        let url = '/api/reports/attendance'; 
        if (selectedConfId !== 'all') {
          url = `/api/reports/conference?id=${selectedConfId}`; 
        }
        const res = await fetch(url);
        const json = await res.json();
        
        if (json.success) {
          setReportData(json.attendanceReport || []);
        } else {
          setReportData([]);
        }
      } catch (err) {
        console.error("Error de red al recuperar analíticas:", err);
        setReportData([]);
      } finally {
        setLoadingReport(false);
      }
    }
    fetchReportData();
  }, [selectedConfId]);

  const handleCreateConference = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      const response = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title,
          room: room,
          speaker_id: speakerId,
          start_time: startTime,
          end_time: endTime      
        }),
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const result = await response.json();
      
      if (result.success) {
        setFormSuccess(true);
        setTimeout(() => setFormSuccess(false), 4000);
        if (result.data) {
          setConferencesList((prev) => [...prev, result.data]);
        }
        setTitle(''); setRoom(''); setSpeakerId(''); setStartTime(''); setEndTime('');
      }
    } catch (error) {
      console.error("Fallo en la transmisión del comando de escritura:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (start?: string, end?: string) => {
    if (!start || !end) return null;
    const now = new Date().getTime();
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();

    if (now < startDate) {
      return <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-widest bg-blue-500/10 border border-blue-500/30 text-blue-400">PROGRAMADA</span>;
    }
    if (now >= startDate && now <= endDate) {
      return <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-widest bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-pulse">EN CURSO</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-widest bg-neutral-500/10 border border-neutral-500/30 text-neutral-500">FINALIZADA</span>;
  };

  const currentSelectedTitle = selectedConfId === 'all' 
    ? 'TODAS LAS CONFERENCIAS' 
    : conferencesList.find(c => c.id === selectedConfId)?.title || 'Seleccionar Ponencia';

  return (
    <div className="relative min-h-screen w-full bg-neutral-950 text-neutral-200 overflow-x-hidden font-sans selection:bg-white/20">
      
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(35,35,45,0.4)_0%,rgba(10,10,12,1)_80%)]" />
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-screen">
          <source src="/bg-admin.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/50 backdrop-blur-[4px]" />
      </div>

      <div className="relative z-10 max-w-[1500px] mx-auto px-6 sm:px-8 pt-8 pb-20">
        <header className="flex items-center justify-between bg-neutral-900/40 border border-white/10 backdrop-blur-xl px-8 py-4 rounded-full mb-12 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)] animate-pulse" />
            <span className="text-xs font-semibold tracking-[0.25em] text-neutral-300 uppercase font-mono">Core • Admin Panel</span>
          </div>
          <div className="bg-white/5 border border-white/10 text-[10px] font-mono tracking-widest uppercase px-4 py-1.5 rounded-full text-neutral-400">
            Root Mode
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <section className="lg:col-span-4 bg-neutral-900/30 border border-white/10 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6 cursor-pointer select-none" onClick={() => setIsFormExpanded(!isFormExpanded)}>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-indigo-400 font-mono">System Core Commands</span>
                <h2 className="text-2xl font-light tracking-tight text-white mt-1">Registrar Ponencia</h2>
              </div>
              <button className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400">
                <svg className={`h-4 w-4 transform transition-transform duration-300 ${isFormExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className={`grid transition-all duration-500 ease-in-out ${isFormExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
              <div className="overflow-hidden space-y-5">
                <form onSubmit={handleCreateConference} className="space-y-5 pt-2">
                  <div>
                    <label className="block text-[10px] font-medium uppercase tracking-widest text-neutral-400 mb-2 font-mono">Título del Evento</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Arquitectura Serverless" className="w-full bg-neutral-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 focus:bg-neutral-950/90 transition shadow-inner" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium uppercase tracking-widest text-neutral-400 mb-2 font-mono">Aula / Auditorio</label>
                    <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Ej. Auditorio Magna B" className="w-full bg-neutral-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 focus:bg-neutral-950/90 transition shadow-inner" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium uppercase tracking-widest text-neutral-400 mb-2 font-mono">ID del Expositor</label>
                    <input type="text" value={speakerId} onChange={(e) => setSpeakerId(e.target.value)} placeholder="Ej. speaker_123" className="w-full bg-neutral-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 focus:bg-neutral-950/90 transition shadow-inner" required />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-widest text-neutral-400 mb-2 font-mono">Hora de Inicio</label>
                      <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-neutral-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 focus:bg-neutral-950/90 transition shadow-inner" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium uppercase tracking-widest text-neutral-400 mb-2 font-mono">Hora de Fin</label>
                      <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-neutral-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 focus:bg-neutral-950/90 transition shadow-inner" required />
                    </div>
                  </div>

                  <button type="submit" disabled={formLoading} className="w-full mt-4 bg-white text-neutral-950 font-semibold text-xs uppercase tracking-widest py-3.5 rounded-xl hover:bg-neutral-200 active:scale-[0.99] transition disabled:opacity-50">
                    {formLoading ? 'Transmitiendo...' : 'Inyectar Conferencia →'}
                  </button>
                </form>
                {formSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                    <p className="text-xs text-emerald-400 font-medium font-mono">✨ Comando ejecutado con éxito en Neon</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="lg:col-span-8 space-y-6">
            
            <div className="bg-neutral-900/30 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400 font-mono">Data Auditing Channel</span>
                  <h2 className="text-xl font-light tracking-tight text-white mt-0.5">Monitor de Ponencias</h2>
                </div>
                
                <div className="relative w-full sm:w-96">
                  <div 
                    onClick={() => setIsConfDropdownOpen(!isConfDropdownOpen)}
                    className="bg-neutral-950 border border-white/10 rounded-full px-5 py-2.5 text-xs text-neutral-200 flex items-center justify-between cursor-pointer select-none hover:border-white/20 transition font-mono shadow-md"
                  >
                    <span className="truncate uppercase font-bold text-indigo-300 mr-2">{currentSelectedTitle}</span>
                    <svg className={`h-4 w-4 text-neutral-400 transform transition-transform duration-300 ${isConfDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  <div className={`grid transition-all duration-300 ease-in-out ${isConfDropdownOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 pointer-events-none absolute w-full z-50'}`}>
                    <div className="overflow-hidden bg-neutral-950/95 border border-white/10 rounded-2xl shadow-2xl divide-y divide-white/5 max-h-96 overflow-y-auto">
                      <div 
                        onClick={() => { setSelectedConfId('all'); setIsConfDropdownOpen(false); }}
                        className={`px-5 py-3 text-xs text-left cursor-pointer transition-colors border-l-2 ${selectedConfId === 'all' ? 'bg-indigo-500/20 border-indigo-500 text-white font-bold' : 'border-transparent text-indigo-400 hover:bg-white/5'}`}
                      >
                        📊 COMPLEMENTO TOTAL (VER TODOS LOS MOVIMIENTOS)
                      </div>
                      
                      {conferencesList.map((conf, index) => (
                        <div 
                          key={`conf-${conf.id || index}`}
                          onClick={() => { setSelectedConfId(conf.id); setIsConfDropdownOpen(false); }}
                          className={`px-5 py-3 text-xs text-left cursor-pointer transition-colors border-l-2 ${selectedConfId === conf.id ? 'bg-white/10 border-white text-white font-medium' : 'border-transparent text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono font-bold text-white truncate">{conf.title}</p>
                            {getStatusBadge(conf.startTime, conf.endTime)}
                          </div>
                          <p className="text-[10px] text-neutral-500 font-mono mt-1">📍 {conf.room} | ID: {conf.id}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900/20 border border-white/10 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="w-full sm:w-1/2 h-48 sm:h-56 relative">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                       <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest text-center">Analítica<br/>En Vivo</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                        <PieChart>
                            <Pie 
                                data={getChartData()} 
                                innerRadius={60} 
                                outerRadius={85} 
                                paddingAngle={5} 
                                dataKey="value"
                                stroke="none"
                            >
                                {getChartData().map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip 
                              contentStyle={{backgroundColor: 'rgba(10,10,10,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', backdropFilter: 'blur(10px)'}} 
                              itemStyle={{color: '#fff'}}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                
                <div className="w-full sm:w-1/2 sm:pl-8 sm:border-l border-t sm:border-t-0 border-white/5 pt-6 sm:pt-0 space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 font-mono mb-2">Distribución de Estados</h3>
                    {getChartData().length === 0 ? (
                        <p className="text-xs text-neutral-600 font-mono">Sin datos analíticos suficientes.</p>
                    ) : (
                        getChartData().map(item => (
                            <div key={item.name} className="flex justify-between items-center text-xs font-mono">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}80`}}></div>
                                    <span className="text-neutral-300">{item.name}</span>
                                </div>
                                <span className="text-white font-bold bg-white/5 px-2 py-0.5 rounded-md">{item.value}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* TABLA DE AUDITORÍA CON BOTÓN DE DESCARGA */}
            <div className="bg-neutral-900/20 border border-white/10 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl">
              
              <div 
                className="px-8 py-5 border-b border-white/5 bg-white/[0.01] flex items-center justify-between cursor-pointer select-none group hover:bg-white/[0.02] transition-colors"
                onClick={(e) => {
                  // Evitamos que al dar clic en el botón de descarga se cierre/abra la tabla
                  if ((e.target as HTMLElement).closest('button.btn-download')) return;
                  setIsTableExpanded(!isTableExpanded);
                }}
              >
                <div className="flex items-center gap-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-300 font-mono group-hover:text-white transition-colors">Consolidado Analítico de Asistencias</h3>
                  {loadingReport && <span className="text-[10px] text-indigo-400 animate-pulse font-mono tracking-widest">REALTIME_FETCH...</span>}
                </div>
                
                <div className="flex items-center gap-3">
                  {/* NUEVO BOTÓN DE EXPORTAR A EXCEL (.CSV) */}
                  <button 
                    onClick={handleDownloadCSV}
                    disabled={reportData.length === 0}
                    className="btn-download bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono font-bold uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Exportar CSV
                  </button>

                  <button className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 group-hover:bg-white/10 group-hover:text-white transition-all">
                    <svg className={`h-4 w-4 transform transition-transform duration-500 ${isTableExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className={`grid transition-all duration-500 ease-in-out ${isTableExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                <div className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-neutral-400 bg-neutral-950/60 font-mono">
                          <th className="py-4 px-8 font-medium">ID Alumno</th>
                          <th className="py-4 px-6 font-medium text-center">Estado de Trazabilidad</th>
                          <th className="py-4 px-6 font-medium text-center">Tiempo Neto Efectivo</th>
                          <th className="py-4 px-8 font-medium text-right">Impactos QR</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {reportData.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-16 text-center text-xs text-neutral-500 font-mono tracking-wider">
                              No se registran marcas sincrónicas para este criterio en Neon Cloud.
                            </td>
                          </tr>
                        ) : (
                          reportData.map((row, index) => {
                            const isExpanded = expandedAlumnoId === row.alumnoId;
                            return (
                              <React.Fragment key={`row-${row.alumnoId || index}`}>
                                <tr 
                                  onClick={() => setExpandedAlumnoId(isExpanded ? null : row.alumnoId)}
                                  className="hover:bg-white/[0.02] cursor-pointer border-b border-white/5 transition-colors group"
                                >
                                  <td className="py-5 px-8 font-mono text-xs font-bold text-neutral-400 group-hover:text-white flex items-center gap-2">
                                    <svg className={`h-3 w-3 text-neutral-500 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-indigo-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                    </svg>
                                    {row.alumnoId}
                                  </td>
                                  <td className="py-5 px-6 text-center">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest border shadow-sm ${
                                      row.ultimoEstado === 'ENTRADA' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                      row.ultimoEstado === 'TARDANZA' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
                                      row.ultimoEstado === 'RETORNO' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                                      'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                    }`}>
                                      {row.ultimoEstado}
                                    </span>
                                  </td>
                                  <td className="py-5 px-6 text-center">
                                    <span className="text-white font-light text-2xl tracking-tight">{row.minutosAsistidos}</span>
                                    <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider ml-1.5">min</span>
                                  </td>
                                  <td className="py-5 px-8 text-right font-mono text-xs text-neutral-400">
                                    {row.totalMarcas} scans
                                  </td>
                                </tr>
                                <tr className="border-none">
                                  <td colSpan={4} className="p-0 bg-white/[0.01]">
                                    <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                                      <div className="overflow-hidden">
                                        <div className="px-12 py-5 bg-neutral-950/40 space-y-4 border-b border-white/5">
                                          <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                                            <span className="font-mono text-indigo-400 font-semibold uppercase tracking-wider">🔬 Auditoría de Trazabilidad Sincrónica</span>
                                            <span className="text-neutral-500 font-mono text-[11px]">Flujos de Persistencia</span>
                                          </div>
                                          <div className="space-y-2">
                                            {row.detalles && row.detalles.length > 0 ? (
                                              row.detalles.map((det, detIndex) => (
                                                <div key={`detalle-${detIndex}`} className="flex items-center justify-between text-xs bg-neutral-900/50 border border-white/5 rounded-lg px-4 py-2.5 font-mono">
                                                  <div className="flex items-center gap-3">
                                                    <span className="text-neutral-500">[{det.hora}]</span>
                                                    <span className={`font-bold ${
                                                      det.tipo === 'ENTRADA' ? 'text-emerald-400' :
                                                      det.tipo === 'RETORNO' ? 'text-indigo-400' : 'text-amber-400'
                                                    }`}>{det.tipo}</span>
                                                  </div>
                                                  <span className="text-neutral-400 text-[11px] bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                                    {det.dispositivo}
                                                  </span>
                                                </div>
                                              ))
                                            ) : (
                                              <p className="text-xs text-neutral-600 font-mono">Sincronizando sub-marcas de la tabla attendance_logs...</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

          </section>
        </main>
      </div>
    </div>
  );
}