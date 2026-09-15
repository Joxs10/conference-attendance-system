// app/alumno/page.tsx
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

export default function AlumnoPage() {
  // MOCK SESSION: Simulamos que el usuario ya pasó por el Login
  const currentUser = { 
    id: 'user_josue', 
    name: 'Josué Solano',
    career: 'Ingeniería Informática'
  };

  const [conferencesList, setConferencesList] = useState<Conference[]>([]);
  const [selectedConf, setSelectedConf] = useState<Conference | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Carga de datos desde Neon DB
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/status');
        const json = await res.json();
        if (json.success && json.data?.conferences) {
          setConferencesList(json.data.conferences);
        } else if (json.data && Array.isArray(json.data)) {
          setConferencesList(json.data);
        }
      } catch (err) {
        console.error("Error al cargar calendario:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // LÓGICA DEL CALENDARIO (Junio 2026)
  // Junio 2026 empieza un Lunes y tiene 30 días.
  const daysInMonth = 30;
  const startingDayOfWeek = 1; // 1 = Lunes
  
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyCells = Array.from({ length: startingDayOfWeek - 1 }, (_, i) => i);

  // Función para encontrar conferencias en un día específico
  const getConferencesForDay = (day: number) => {
    return conferencesList.filter(conf => {
      if (!conf.startTime) return false;
      const confDate = new Date(conf.startTime);
      // Filtramos que coincida el día y el mes (Junio = 5 en JS)
      return confDate.getDate() === day && confDate.getMonth() === 5 && confDate.getFullYear() === 2026;
    });
  };

  // GENERADOR DE PAYLOAD QR
  // Este JSON es exactamente lo que leerá el escáner del ponente
  const qrPayload = selectedConf 
    ? JSON.stringify({ assistantId: currentUser.id, conferenceId: selectedConf.id })
    : '';

  const qrImageUrl = qrPayload 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrPayload)}&bgcolor=ffffff&color=000000`
    : '';
    
  return (
    <div className="relative min-h-screen w-full bg-neutral-950 text-neutral-200 overflow-x-hidden font-sans selection:bg-white/20">
      
      {/* FONDO GLASSMORPHISM */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(35,35,45,0.4)_0%,rgba(10,10,12,1)_80%)]" />
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-screen">
          <source src="/bg-admin.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/50 backdrop-blur-[4px]" />
      </div>

      <div className="relative z-10 max-w-[1500px] mx-auto px-6 sm:px-8 pt-8 pb-20">
        
        {/* HEADER DE SESIÓN ALUMNO */}
        <header className="flex items-center justify-between bg-neutral-900/40 border border-white/10 backdrop-blur-xl px-8 py-4 rounded-[2rem] mb-8 shadow-2xl">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-indigo-400 font-mono">Portal Universitario</span>
            <h1 className="text-2xl font-light tracking-tight text-white mt-1">Intranet Académica</h1>
          </div>
          <div className="flex items-center gap-4 bg-neutral-950/50 border border-white/5 px-4 py-2 rounded-xl">
            <div className="text-right">
              <p className="text-sm font-bold text-white">{currentUser.name}</p>
              <p className="text-[10px] font-mono text-neutral-400">{currentUser.career} | {currentUser.id}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-bold shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              JS
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: EL CALENDARIO (7 columnas) */}
          <section className="xl:col-span-8 bg-neutral-900/30 border border-white/10 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-light text-white">Cronograma de Eventos</h2>
              <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-mono font-bold text-indigo-300 uppercase tracking-widest">
                Junio 2026
              </div>
            </div>

            {loading ? (
              <div className="h-96 flex items-center justify-center">
                <span className="text-sm font-mono text-indigo-400 animate-pulse tracking-widest">SINCRONIZANDO CALENDARIO...</span>
              </div>
            ) : (
              <div className="w-full">
                {/* Días de la semana */}
                <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                    <div key={d} className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 font-mono py-2">{d}</div>
                  ))}
                </div>

                {/* Matriz del Calendario */}
                <div className="grid grid-cols-7 gap-2">
                  {emptyCells.map(cell => (
                    <div key={`empty-${cell}`} className="min-h-[100px] bg-white/[0.01] rounded-xl border border-white/[0.02]"></div>
                  ))}
                  
                  {calendarDays.map(day => {
                    const dayConferences = getConferencesForDay(day);
                    const isToday = day === 28; // Simulamos que hoy es 28 de Junio
                    
                    return (
                      <div 
                        key={`day-${day}`} 
                        className={`min-h-[120px] rounded-xl border p-2 transition-colors ${
                          isToday ? 'bg-indigo-500/10 border-indigo-500/30 shadow-inner' : 'bg-neutral-950/40 border-white/5 hover:bg-white/5'
                        }`}
                      >
                        <span className={`text-xs font-mono font-bold ${isToday ? 'text-indigo-400' : 'text-neutral-500'}`}>{day}</span>
                        
                        <div className="mt-2 space-y-1.5">
                          {dayConferences.map(conf => (
                            <div 
                              key={conf.id}
                              onClick={() => setSelectedConf(conf)}
                              className={`text-[9px] px-2 py-1.5 rounded-md cursor-pointer truncate font-mono transition-all border ${
                                selectedConf?.id === conf.id 
                                  ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                                  : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10 hover:border-white/20'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 mb-px animate-pulse"></span>
                              {conf.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* COLUMNA DERECHA: DETALLES Y CÓDIGO QR (5 columnas) */}
          <section className="xl:col-span-4 space-y-6">
            <div className="bg-neutral-900/30 border border-white/10 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl min-h-[600px] flex flex-col relative overflow-hidden">
              
              {selectedConf ? (
                <>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse"></div>
                  
                  <div className="mb-8">
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-400 font-mono">Evento Seleccionado</span>
                    <h3 className="text-xl font-bold text-white mt-2 leading-tight">{selectedConf.title}</h3>
                    
                    <div className="mt-4 space-y-2 bg-neutral-950/50 p-4 rounded-xl border border-white/5 font-mono text-xs text-neutral-300">
                      <p><span className="text-neutral-500">📍 Aula:</span> {selectedConf.room}</p>
                      <p><span className="text-neutral-500">🎤 Expositor:</span> {selectedConf.speakerId}</p>
                      <p><span className="text-neutral-500">⏰ Inicio:</span> {new Date(selectedConf.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>

                  <div className="flex-grow flex flex-col items-center justify-center">
                    <p className="text-xs text-neutral-400 font-mono mb-6 text-center uppercase tracking-widest">
                      Tu Credencial de Acceso
                    </p>
                    
                    <div className="bg-white p-4 rounded-3xl shadow-[0_0_40px_rgba(129,140,248,0.2)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrImageUrl} alt="QR Code" className="w-56 h-56 rounded-xl" />
                    </div>

                    <div className="mt-8 bg-neutral-950/80 border border-white/5 px-4 py-3 rounded-xl w-full text-center">
                      <p className="text-[9px] text-neutral-500 font-mono uppercase mb-1">Carga Útil Encriptada</p>
                      <p className="text-[10px] text-indigo-300 font-mono truncate">{qrPayload}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center opacity-50">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-light text-white mb-2">Ningún evento seleccionado</h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    Haz clic en una conferencia del<br/>calendario para generar tu código QR.
                  </p>
                </div>
              )}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}