
export type TipoMarca = 'ENTRADA' | 'SALIDA_TEMPORAL';
export type EstadoAsistenciaFinal = 'ASISTIÓ' | 'TARDANZA' | 'INASISTENTE';

export interface MarcaAsistencia {
  id: string;
  asistenteId: string;
  conferenciaId: string;
  tipoMarca: TipoMarca;
  timestamp: Date;
  dispositivoId: string;
}

export interface ConsolidadoAsistencia {
  asistenteId: string;
  conferenciaId: string;
  totalEntradas: number;
  totalSalidasTemporales: number;
  tiempoEfectivoMinutos: number;
  porcentajePermanencia: number;
  estadoFinal: EstadoAsistenciaFinal;
}