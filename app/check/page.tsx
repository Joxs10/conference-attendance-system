// app/check/page.tsx
'use client';

import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function CheckPage() {
  const [status, setStatus] = useState<{type: 'idle' | 'success' | 'error', msg: string, stateDetail?: string}>({ 
    type: 'idle', 
    msg: 'Cámara activada. Esperando credencial QR...' 
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScan = async (text: string) => {
    if (isProcessing || !text) return;
    
    setIsProcessing(true);
    setStatus({ type: 'idle', msg: 'Analizando token encriptado...' });

    try {
      // Intentamos parsear el JSON que generó tu módulo Alumno
      const payload = JSON.parse(text);

      if (!payload.assistantId || !payload.conferenceId) {
        throw new Error("El QR no pertenece al formato de la Intranet");
      }

      // Disparamos a la base de datos
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantId: payload.assistantId,
          conferenceId: payload.conferenceId,
          deviceId: 'Lector_Principal_Puerta_1'
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus({ 
          type: 'success', 
          msg: `Operación exitosa: ${payload.assistantId}`,
          stateDetail: data.state
        });
        
        // Cooldown de 3 segundos para evitar doble escaneo accidental
        setTimeout(() => {
          setStatus({ type: 'idle', msg: 'Cámara activada. Esperando credencial QR...' });
          setIsProcessing(false);
        }, 3000);
      } else {
        throw new Error(data.error);
      }

    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Código QR no reconocido o dañado.' });
      
      setTimeout(() => {
        setStatus({ type: 'idle', msg: 'Cámara activada. Esperando credencial QR...' });
        setIsProcessing(false);
      }, 3000);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-neutral-950 text-neutral-200 overflow-hidden font-sans flex flex-col items-center justify-center p-6">
      
      {/* FONDO GLASSMORPHISM */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen">
          <source src="/bg-admin.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/80 backdrop-blur-[4px]" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">Tótem Sincrónico Activo</span>
          </div>
          <h1 className="text-3xl font-light text-white tracking-tight">Control de Acceso</h1>
        </div>

        {/* CONTENEDOR DEL ESCÁNER */}
        <div className={`w-full aspect-square rounded-[2rem] overflow-hidden border-2 transition-all duration-300 shadow-2xl relative ${
          status.type === 'success' ? 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)]' :
          status.type === 'error' ? 'border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.3)]' :
          'border-white/10 backdrop-blur-xl'
        }`}>
          
          {/* Capa de bloqueo visual mientras procesa (Cooldown) */}
          {isProcessing && status.type !== 'idle' ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-950/90 backdrop-blur-md">
              <div className="text-center">
                {status.type === 'success' && (
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {status.type === 'error' && (
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                <h3 className={`text-xl font-bold ${status.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {status.stateDetail || 'ERROR'}
                </h3>
              </div>
            </div>
          ) : (
            <>
              {/* El componente de la cámara real se DESMONTA de la memoria durante el cooldown */}
              <div className="w-full h-full relative z-10 [&>div]:!h-full [&>div>video]:!object-cover">
                <Scanner 
                  formats={['qr_code']}
                  onScan={(detectedCodes) => {
                    if (detectedCodes && detectedCodes.length > 0) {
                      handleScan(detectedCodes[0].rawValue);
                    }
                  }} 
                  onError={(error) => console.log("Error de cámara:", error)}
                />
              </div>
              
              {/* Mirilla visual estilo Cyberpunk/Moderno */}
              <div className="absolute inset-0 z-10 pointer-events-none p-6">
                 <div className="w-full h-full border border-white/20 rounded-xl relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-500 -translate-x-1 -translate-y-1"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-500 translate-x-1 -translate-y-1"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-500 -translate-x-1 translate-y-1"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-500 translate-x-1 translate-y-1"></div>
                 </div>
              </div>
            </>
          )}
        </div>

        {/* FEEDBACK DE TEXTO INFERIOR */}
        <div className="mt-8 bg-neutral-900/60 border border-white/10 px-6 py-4 rounded-2xl w-full text-center backdrop-blur-md">
          <p className="text-xs font-mono text-neutral-400">{status.msg}</p>
        </div>

      </div>
    </div>
  );
}