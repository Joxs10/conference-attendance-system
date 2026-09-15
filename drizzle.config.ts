// drizzle.config.ts
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Cargar la variable de entorno desde nuestro archivo local
dotenv.config({ path: '.env.local' });

export default {
  schema: './src/infrastructure/db/schema.ts', // Ruta hacia nuestras tablas
  out: './drizzle',                             // Carpeta para el historial de cambios
  dialect: 'postgresql',                        // Tipo de base de datos
  dbCredentials: {
    url: process.env.DATABASE_URL!,             // URL secreta de tu .env.local
  },
} satisfies Config;