// src/infrastructure/db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// 1. Validamos que la URL secreta exista en las variables de entorno
if (!process.env.DATABASE_URL) {
  throw new Error('La variable de entorno DATABASE_URL no está configurada.');
}

// 2. Creamos la conexión HTTP con el servidor de Neon
const sql = neon(process.env.DATABASE_URL);

// 3. Inicializamos Drizzle pasándole la conexión y el esquema de las tablas
export const db = drizzle(sql, { schema });