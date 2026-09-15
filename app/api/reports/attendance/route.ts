// app/api/reports/attendance/route.ts
export const dynamic = 'force-dynamic'; 

import { NextResponse } from 'next/server';
import { db } from '../../../../src/infrastructure/db';
import { attendanceLogs, conferences } from '../../../../src/infrastructure/db/schema'; 
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const rawConferences = await db.select().from(conferences);
    const confMap = new Map();
    rawConferences.forEach(c => confMap.set(c.id, c));

    const rawLogs = await db.select().from(attendanceLogs).orderBy(desc(attendanceLogs.timestamp));
    const agrupadoPorAlumno = new Map<string, any>();

    rawLogs.forEach((log: any) => {
      const { assistantId, logType, timestamp, conferenceId } = log; 
      
      if (!agrupadoPorAlumno.has(assistantId)) {
        // FIX MATEMÁTICO: Cierre virtual para los que siguen en sala
        let cronometroActivo = null;
        if (logType === 'ENTRADA' || logType === 'RETORNO') {
           const conf = confMap.get(conferenceId);
           const now = Date.now();
           const confEndTime = conf ? new Date(conf.startTime).getTime() + (2 * 3600000) : now; // Fallback si no hay endTime
           const realEndTime = conf && conf.endTime ? new Date(conf.endTime).getTime() : confEndTime;
           cronometroActivo = Math.min(now, realEndTime);
        }

        agrupadoPorAlumno.set(assistantId, {
          alumnoId: assistantId,
          ultimoEstado: logType,
          minutosAsistidos: 0, 
          totalMarcas: 0,
          detalles: [],
          _tempEntrada: cronometroActivo, // Inyectamos el límite superior
          _conferenceId: conferenceId,
          _horaLlegada: null 
        });
      }

      const alumnoData = agrupadoPorAlumno.get(assistantId);
      alumnoData.totalMarcas += 1;
      
      const fecha = new Date(timestamp);
      const horaFormateada = fecha.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      if (logType === 'ENTRADA') {
        alumnoData._horaLlegada = fecha;
      }

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
      const conf = confMap.get(alumno._conferenceId);
      if (conf && alumno._horaLlegada) {
        const inicioConferencia = new Date(conf.startTime).getTime();
        const tolerancia = (conf.toleranceMinutesInput || 15) * 60000; 
        const limiteLlegada = inicioConferencia + tolerancia;

        if (alumno._horaLlegada.getTime() > limiteLlegada) {
          if (alumno.ultimoEstado === 'ENTRADA') {
            alumno.ultimoEstado = 'TARDANZA';
          }
        }
      }
      delete alumno._tempEntrada;
      delete alumno._conferenceId;
      delete alumno._horaLlegada;
      return alumno;
    });

    return NextResponse.json({ success: true, attendanceReport: consolidadoTotal }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}