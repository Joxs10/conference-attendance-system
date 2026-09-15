// src/infrastructure/repositories/AttendanceRepository.ts
import { db } from '../db/index';
import { attendanceLogs } from '../db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

export class AttendanceRepository {
  // Busca la última marca del alumno en una conferencia (Máquina de estados)
  async findLastLog(conferenciaId: string, assistantId: string) {
    const [lastLog] = await db.select()
      .from(attendanceLogs)
      .where(
        and(
          eq(attendanceLogs.conferenceId, conferenciaId),
          eq(attendanceLogs.assistantId, assistantId)
        )
      )
      .orderBy(desc(attendanceLogs.timestamp))
      .limit(1);
    return lastLog;
  }

  // Inserta una nueva marca en Neon
  async save(logData: {
    assistantId: string;
    conferenceId: string;
    logType: 'ENTRADA' | 'SALIDA_TEMPORAL' | 'RETORNO';
    deviceId: string;
    timestamp: Date;
  }) {
    const [insertedLog] = await db.insert(attendanceLogs).values(logData).returning();
    return insertedLog;
  }

  // Trae todos los logs de una conferencia ordenados cronológicamente (Para el Reporte)
  async findLogsByConference(conferenciaId: string) {
    return await db.select()
      .from(attendanceLogs)
      .where(eq(attendanceLogs.conferenceId, conferenciaId))
      .orderBy(asc(attendanceLogs.timestamp));
  }
}