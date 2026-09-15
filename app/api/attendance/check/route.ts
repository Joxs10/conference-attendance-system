// app/api/attendance/check/route.ts
import { NextResponse } from 'next/server';
import { AttendanceRepository } from '../../../../src/infrastructure/repositories/AttendanceRepository';
import { ConferenceRepository } from '../../../../src/infrastructure/repositories/ConferenceRepository';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { qrToken, conferenciaId, dispositivoId } = body;

    if (!qrToken || !conferenciaId || !dispositivoId) {
      return NextResponse.json({ success: false, error: "CAMPOS_INCOMPLETOS" }, { status: 400 });
    }

    const assistantId = qrToken.split('_').pop() || 'user_UNKNOWN';
    const ahora = new Date();

    // Instanciamos los repositorios (Abstracción de datos completa)
    const attendanceRepo = new AttendanceRepository();
    const conferenceRepo = new ConferenceRepository();

    // 1. Obtener los datos de la conferencia vía repositorio
    const conference = await conferenceRepo.findById(conferenciaId);
    if (!conference) {
      return NextResponse.json({ success: false, error: "CONFERENCIA_NO_EXISTE" }, { status: 404 });
    }

    // 2. Buscar la última marca del alumno vía repositorio
    const lastLog = await attendanceRepo.findLastLog(conferenciaId, assistantId);

    // 3. Máquina de Estados: Determinar el siguiente tipo de marca
    let proximoEstado: 'ENTRADA' | 'SALIDA_TEMPORAL' | 'RETORNO' = 'ENTRADA';

    if (lastLog) {
      if (lastLog.logType === 'ENTRADA' || lastLog.logType === 'RETORNO') {
        proximoEstado = 'SALIDA_TEMPORAL';
      } else if (lastLog.logType === 'SALIDA_TEMPORAL') {
        proximoEstado = 'RETORNO';
      }
    }

    // 4. Registrar la nueva marca usando el patrón repositorio
    const insertedLog = await attendanceRepo.save({
      assistantId,
      conferenceId: conferenciaId,
      logType: proximoEstado,
      deviceId: dispositivoId,
      timestamp: ahora
    });

    return NextResponse.json({
      success: true,
      message: `Marcación registrada vía Repositorio: ${proximoEstado}`,
      data: {
        registroId: insertedLog.id,
        asistenteId: insertedLog.assistantId,
        tipoMarca: insertedLog.logType,
        horaMarcacion: insertedLog.timestamp
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error en endpoint QR con repositorio:", error);
    return NextResponse.json({ success: false, error: "ERROR_INTERNO" }, { status: 500 });
  }
}