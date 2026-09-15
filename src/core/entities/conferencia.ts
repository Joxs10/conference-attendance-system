
export interface Conferencia {
  id: string;
  titulo: string;
  expositorId: string;
  sala: string;
  horaInicio: Date;
  horaFin: Date;
  
  // Configuración de la ventana de tiempo para el control de acceso
  minutosToleranciaIngreso: number;
  minutosToleranciaSalida: number;
}

export interface VentanaTiempoStatus {
  estaAbierta: boolean;
  motivoRechazo?: 'ANTES_DE_TIEMPO' | 'DESPUES_DE_TIEMPO' | 'OK';
}