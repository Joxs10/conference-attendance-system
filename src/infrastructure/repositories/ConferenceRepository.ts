// src/infrastructure/repositories/ConferenceRepository.ts
import { db } from '../db/index';
import { conferences } from '../db/schema';
import { eq } from 'drizzle-orm';

export class ConferenceRepository {
  // Busca una conferencia por su ID único
  async findById(id: string) {
    const [conference] = await db.select().from(conferences).where(eq(conferences.id, id));
    return conference;
  }
}