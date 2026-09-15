// app/api/reports/conference/route.ts
export const dynamic = 'force-dynamic'; 

import { NextResponse } from 'next/server';
import { db } from '../../../../src/infrastructure/db';
import { attendanceLogs, conferences } from '../../../../src/infrastructure/db/schema'; 
import { desc, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conferenceId = searchParams.get('id');

    if (!conferenceId) {
      return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
    }

    const rawConferences = await db.select().from(conferences).where(eq(conferences.id, conferenceId));
    if (rawConferences.length === 0) return NextResponse.json({ success: true, attendanceReport: [] }, { status: 200 });
    const conf = rawConferences[0];

    const rawLogs = await db.select()
      .from(attendanceLogs)
      .where(eq(attendanceLogs.conferenceId, conferenceId))
      .orderBy(desc(attendanceLogs.timestamp));
      
    const agrupadoPorAlumno = new Map<string, any>();

    rawLogs.forEach((log: any) => {
      const { assistantId, logType, timestamp } = log; 
      
      if (!agrupadoPorAlumno.has(assistantId)) {
        // FIX MATEMÁTICO
        let cronometroActivo = null;
        if (logType === 'ENTRADA' || logType === 'RETORNO') {
           const now = Date.now();
           const confEndTime = new Date(conf.endTime).getTime();
           cronometroActivo = Math.min(now, confEndTime);
        }

        agrupadoPorAlumno.set(assistantId, {
          alumnoId: assistantId,
          ultimoEstado: logType,
          minutosAsistidos: 0, 
          totalMarcas: 0,
          detalles: [],
          _tempEntrada: cronometroActivo,
          _horaLlegada: null
        });
      }

      const alumnoData = agrupadoPorAlumno.get(assistantId);
      alumnoData.totalMarcas += 1;
      
      const fecha = new Date(timestamp);
      const horaFormateada = fecha.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      if (logType === 'ENTRADA') alumnoData._horaLlegada = fecha;

      alumnoData.detalles.push({
        hora: horaFormateada,
        tipo: logType,
        dispositivo: log.deviceId || "Escáner Principal"
      });

      if (logType === 'SALIDA_TEMPORAL' || logType === 'SALIDA') {
        alumnoData._tempEntrada = fecha.getTime();
      } else if ((logType === 'ENTRADA' || logType === 'RETORNO') && alumnoData._tempEntrada) {
        const diffMilisegundos = alumnoData._tempEntrada - fecha.getTime();
        const diffMinutos = Math.floor(diffMilisegundos / 60000);
        alumnoData.minutosAsistidos += Math.max(0, diffMinutos); 
        alumnoData._tempEntrada = null;
      }
    });

    const consolidadoTotal = Array.from(agrupadoPorAlumno.values()).map(alumno => {
      if (alumno._horaLlegada) {
        const inicioConferencia = new Date(conf.startTime).getTime();
        const tolerancia = (conf.toleranceMinutesInput || 15) * 60000; 
        const limiteLlegada = inicioConferencia + tolerancia;

        if (alumno._horaLlegada.getTime() > limiteLlegada && alumno.ultimoEstado === 'ENTRADA') {
          alumno.ultimoEstado = 'TARDANZA';
        }
      }
      delete alumno._tempEntrada;
      delete alumno._horaLlegada;
      return alumno;
    });

    return NextResponse.json({ success: true, attendanceReport: consolidadoTotal }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}