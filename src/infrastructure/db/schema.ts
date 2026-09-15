// src/infrastructure/db/schema.ts
import { pgTable, uuid, varchar, timestamp, integer } from 'drizzle-orm/pg-core';

export const conferences = pgTable('conferences', {
  id: varchar('id', { length: 50 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  speakerId: varchar('speaker_id', { length: 50 }).notNull(),
  room: varchar('room', { length: 100 }).notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  toleranceMinutesInput: integer('tolerance_minutes_input').default(15).notNull(),
  toleranceMinutesOutput: integer('tolerance_minutes_output').default(15).notNull(),
});

export const attendanceLogs = pgTable('attendance_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  assistantId: varchar('assistant_id', { length: 50 }).notNull(),
  conferenceId: varchar('conference_id', { length: 50 })
    .references(() => conferences.id, { onDelete: 'cascade' })
    .notNull(),
  logType: varchar('log_type', { length: 20 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  deviceId: varchar('device_id', { length: 100 }).notNull(),
});