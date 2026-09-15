// app/ponente/page.tsx
'use client';

import React, { useState, useEffect } from 'react';

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
  // Aseguramos que la interfaz espera los detalles
  detalles?: {
    hora: string;
    tipo: string;
    dispositivo: string;
  }[];
}

export default function PonentePage() {
  const currentSpeaker = {
    id: 'speaker_123',
    name: 'Ing. Fernando (Expositor)',
    role: 'Ponente Principal'
  };

  const [myConferences, setMyConferences] = useState<Conference[]>([]);
  const [selectedConf, setSelectedConf] = useState<Conference | null>(null);
  const [reportData, setReportData] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // NUEVO ESTADO: Para controlar el acordeón
  const [expandedAlumnoId, setExpandedAlumnoId] = useState<string | null>(null);

  useEffect(() => {
    async function loadConferences() {
      try {
        const res = await fetch('/api/status');
        const json = await res.json();
        let allConfs: Conference[] = [];
        
        if (json.success && json.data?.conferences) allConfs = json.data.conferences;
        else if (json.data && Array.isArray(json.data)) allConfs = json.data;
        
        const mine = allConfs.filter(c => c.speakerId === currentSpeaker.id);
        setMyConferences(mine);
        
        if (mine.length > 0) setSelectedConf(mine[0]);
      } catch (err) {
        console.error("Error al cargar agenda:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConferences();
  }, [currentSpeaker.id]);

  const fetchReport = async (confId: string) => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/reports/conference?id=${confId}`);
      const json = await res.json();
      if (json.success) setReportData(json.attendanceReport || []);
    } catch (err) {
      console.error("Error cargando el reporte en vivo:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedConf) {
      fetchReport(selectedConf.id);
      const interval = setInterval(() => {
        fetchReport(selectedConf.id);
      }, 10000); 
      return () => clearInterval(interval);
    }
  }, [selectedConf]);

  const enSalaCount = reportData.filter(r => ['ENTRADA', 'RETORNO', 'TARDANZA'].includes(r.ultimoEstado)).length;
  const fueraCount = reportData.filter(r => r.ultimoEstado === 'SALIDA_TEMPORAL').length;
  const totalRegistrados = reportData.length;

  return (
    <div className="relative min-h-screen w-full bg-neutral-950 text-neutral-200 overflow-x-hidden font-sans selection:bg-white/20">
      
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(35,35,45,0.4)_0%,rgba(10,10,12,1)_80%)]" />
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen">
          <source src="/bg-admin.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/70 backdrop-blur-[4px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-8 pt-8 pb-20">
        
        <header className="flex items-center justify-between bg-neutral-900/40 border border-white/10 backdrop-blur-xl px-8 py-4 rounded-[2rem] mb-8 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              {currentSpeaker.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-light tracking-tight text-white">{currentSpeaker.name}</h1>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-amber-500 font-mono">
                {currentSpeaker.role} | {currentSpeaker.id}
              </span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${refreshing ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`}></span>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">Live Sync</span>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <section className="lg:col-span-4 space-y-6">
            <div className="bg-neutral-900/30 border border-white/10 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl min-h-[400px]">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 font-mono mb-6 border-b border-white/5 pb-4">Mis Ponencias Asignadas</h2>
              
              {loading ? (
                <div className="animate-pulse text-xs text-amber-400 font-mono">Cargando agenda...</div>
              ) : myConferences.length === 0 ? (
                <p className="text-xs text-neutral-500 font-mono">No tienes conferencias asignadas actualmente.</p>
              ) : (
                <div className="space-y-3">
                  {myConferences.map(conf => (
                    <div 
                      key={conf.id}
                      onClick={() => setSelectedConf(conf)}
                      className={`p-4 rounded-xl cursor-pointer transition-all border ${
                        selectedConf?.id === conf.id 
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <h3 className={`font-bold truncate ${selectedConf?.id === conf.id ? 'text-amber-400' : 'text-white'}`}>
                        {conf.title}
                      </h3>
                      <p className="text-[10px] text-neutral-500 font-mono mt-1">📍 Aula: {conf.room}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="lg:col-span-8">
            {selectedConf ? (
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-neutral-900/40 border border-emerald-500/30 backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono mb-1">En Sala Ahora</p>
                    <p className="text-5xl font-light text-white">{enSalaCount}</p>
                  </div>
                  
                  <div className="bg-neutral-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-amber-500 font-mono mb-1">Fuera del Aula</p>
                    <p className="text-4xl font-light text-neutral-300">{fueraCount}</p>
                  </div>

                  <div className="bg-neutral-900/40 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono mb-1">Total Impactos</p>
                    <p className="text-4xl font-light text-neutral-300">{totalRegistrados}</p>
                  </div>
                </div>

                <div className="bg-neutral-900/30 border border-white/10 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl">
                  <div className="px-8 py-5 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-white font-mono">Radar de Alumnos en Vivo</h3>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <tbody className="text-sm">
                        {reportData.length === 0 ? (
                          <tr>
                            <td className="py-12 text-center text-xs text-neutral-500 font-mono">
                              Aún no hay alumnos detectados por el escáner.
                            </td>
                          </tr>
                        ) : (
                          reportData.map((row, i) => {
                            const isExpanded = expandedAlumnoId === row.alumnoId;
                            
                            return (
                              <React.Fragment key={`row-${row.alumnoId || i}`}>
                                <tr 
                                  onClick={() => setExpandedAlumnoId(isExpanded ? null : row.alumnoId)}
                                  className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors group"
                                >
                                  <td className="py-4 px-8 font-mono text-xs font-bold text-neutral-300 group-hover:text-white flex items-center gap-2">
                                    <svg className={`h-3 w-3 text-neutral-500 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-amber-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                    </svg>
                                    {row.alumnoId}
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-mono font-bold tracking-widest border ${
                                      row.ultimoEstado === 'ENTRADA' || row.ultimoEstado === 'RETORNO' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                      row.ultimoEstado === 'TARDANZA' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
                                      'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                    }`}>
                                      {row.ultimoEstado}
                                    </span>
                                  </td>
                                </tr>
                                
                                {/* EL ACORDEÓN DE TRAZABILIDAD */}
                                <tr className="border-none">
                                  <td colSpan={2} className="p-0 bg-white/[0.01]">
                                    <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                                      <div className="overflow-hidden">
                                        <div className="px-12 py-5 bg-neutral-950/40 space-y-4 border-b border-white/5">
                                          <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                                            <span className="font-mono text-amber-500/80 font-semibold uppercase tracking-wider">🔬 Historial de Trazabilidad</span>
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
                                              <p className="text-xs text-neutral-600 font-mono">Sincronizando sub-marcas...</p>
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
            ) : (
              <div className="bg-neutral-900/30 border border-white/10 backdrop-blur-xl rounded-[2rem] h-full flex flex-col items-center justify-center min-h-[400px] opacity-50">
                <svg className="w-16 h-16 text-neutral-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <p className="text-sm font-mono text-neutral-400">Selecciona una conferencia a la izquierda</p>
              </div>
            )}
          </section>

        </main>
      </div>
    </div>
  );
}