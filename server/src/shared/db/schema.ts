import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const topics = sqliteTable(
  "topics",
  {
    id: text("id").primaryKey(),
    titleId: text("title_id").notNull(),
    onairDate: text("onair_date").notNull(),
    headline: text("headline").notNull(),
    cornerStartTime: text("corner_start_time"),
    cornerEndTime: text("corner_end_time"),
    headlineGenre: text("headline_genre"),
    broadcastScript: text("broadcast_script"),
  },
  (table) => [
    index("idx_topics_titleid_date").on(table.titleId, table.onairDate),
  ]
);

export const audienceVoices = sqliteTable(
  "audience_voices",
  {
    id: text("id").primaryKey(),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id),
    text: text("text").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_audience_voices_topic").on(table.topicId)]
);

export const dialogSessions = sqliteTable(
  "dialog_sessions",
  {
    id: text("id").primaryKey(),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    endedAt: text("ended_at"),
  },
  (table) => [index("idx_dialog_sessions_topic").on(table.topicId)]
);

export const dialogLogs = sqliteTable(
  "dialog_logs",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => dialogSessions.id),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id),
    speaker: text("speaker").notNull(),
    text: text("text").notNull(),
    source: text("source"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_dialog_logs_session").on(table.sessionId),
    index("idx_dialog_logs_topic_created").on(table.topicId, table.createdAt),
  ]
);

export const materials = sqliteTable(
  "materials",
  {
    id: text("id").primaryKey(),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id),
    type: text("type").notNull(),
    content: text("content").notNull(),
    vectorizeId: text("vectorize_id"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_materials_topic").on(table.topicId)]
);
