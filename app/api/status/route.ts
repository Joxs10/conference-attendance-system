import { NextResponse } from 'next/server';

// 1. RUTAS CORREGIDAS: Apuntando exactamente a tu estructura de carpetas
import { db } from '../../../src/infrastructure/db'; 
import { conferences } from '../../../src/infrastructure/db/schema';

// ==========================================
// CANAL DE LECTURA: Lista las conferencias
// ==========================================
export async function GET() {
  try {
    const allConferences = await db.select().from(conferences);
    return NextResponse.json({ success: true, data: { conferences: allConferences } }, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo conferencias:", error);
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}

// ==========================================
// CANAL DE ESCRITURA: Crea una nueva ponencia
// ==========================================
// app/api/status/route.ts (Solo la función POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const nuevaConferencia = await db.insert(conferences).values({
      id: `conf_${Date.now()}`,
      title: body.title,
      room: body.room,
      speakerId: body.speaker_id, 
      // AHORA RECIBIMOS LAS FECHAS EXACTAS DESDE EL FRONTEND
      startTime: new Date(body.start_time),      
      endTime: new Date(body.end_time), 
      toleranceMinutesInput: 15,  
      toleranceMinutesOutput: 15  
    }).returning(); 

    return NextResponse.json({ 
      success: true, 
      message: "Conferencia inyectada correctamente",
      data: nuevaConferencia[0] 
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error crítico en Neon DB:", error);
    return NextResponse.json({ 
      error: "Error interno del servidor al crear conferencia" 
    }, { status: 500 });
  }
}