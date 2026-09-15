// app/api/check/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '../../../src/infrastructure/db';
import { attendanceLogs } from '../../../src/infrastructure/db/schema';
import { desc, eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assistantId, conferenceId, deviceId = 'Scanner_Principal' } = body;

    if (!assistantId || !conferenceId) {
      return NextResponse.json({ error: "El código QR no contiene el formato requerido." }, { status: 400 });
    }

    // 1. MOTOR DE INFERENCIA DE ESTADO: Buscamos qué fue lo último que hizo este alumno en esta conferencia
    const lastLog = await db.select()
      .from(attendanceLogs)
      .where(and(
        eq(attendanceLogs.assistantId, assistantId),
        eq(attendanceLogs.conferenceId, conferenceId)
      ))
      .orderBy(desc(attendanceLogs.timestamp))
      .limit(1);

    // 2. LÓGICA DE ESTADO (Máquina de Estados Finita)
    let nextState = 'ENTRADA'; // Por defecto, si es su primer escaneo, entra.

    if (lastLog.length > 0) {
      const currentState = lastLog[0].logType;
      // Si ya estaba adentro, entonces está saliendo al baño/afuera
      if (currentState === 'ENTRADA' || currentState === 'RETORNO') {
        nextState = 'SALIDA_TEMPORAL';
      } 
      // Si estaba afuera, entonces está regresando
      else if (currentState === 'SALIDA_TEMPORAL') {
        nextState = 'RETORNO';
      }
      // Nota: Si el estado era 'TARDANZA', igual cuenta como que estaba adentro, así que el frontend de análisis lo manejará.
    }

    // 3. PERSISTENCIA EN NEON CLOUD
    const newLog = await db.insert(attendanceLogs).values({
      id: crypto.randomUUID(), // Generamos ID único
      assistantId: assistantId,
      conferenceId: conferenceId,
      logType: nextState,
      deviceId: deviceId,
      timestamp: new Date() // La hora exacta del impacto
    }).returning();

    return NextResponse.json({ 
      success: true, 
      state: nextState, 
      log: newLog[0] 
    }, { status: 200 });

  } catch (error) {
    console.error("Error en la API de Escaneo:", error);
    return NextResponse.json({ error: "Falla de red con Neon Database" }, { status: 500 });
  }
}