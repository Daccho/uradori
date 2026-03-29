import { env } from "cloudflare:test";
import { beforeAll, afterEach } from "vitest";

// Combined migration SQL from drizzle/migrations/
// 0000_gorgeous_gorgon.sql + 0001_add_video_url.sql
const MIGRATION_STATEMENTS = [
  // topics (base)
  `CREATE TABLE IF NOT EXISTS \`topics\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`title_id\` text NOT NULL,
    \`onair_date\` text NOT NULL,
    \`headline\` text NOT NULL,
    \`corner_start_time\` text,
    \`corner_end_time\` text,
    \`headline_genre\` text,
    \`broadcast_script\` text
  )`,
  `CREATE INDEX IF NOT EXISTS \`idx_topics_titleid_date\` ON \`topics\` (\`title_id\`,\`onair_date\`)`,
  // audience_voices
  `CREATE TABLE IF NOT EXISTS \`audience_voices\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`topic_id\` text NOT NULL,
    \`text\` text NOT NULL,
    \`created_at\` text DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (\`topic_id\`) REFERENCES \`topics\`(\`id\`) ON UPDATE no action ON DELETE no action
  )`,
  `CREATE INDEX IF NOT EXISTS \`idx_audience_voices_topic\` ON \`audience_voices\` (\`topic_id\`)`,
  // dialog_sessions
  `CREATE TABLE IF NOT EXISTS \`dialog_sessions\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`topic_id\` text NOT NULL,
    \`status\` text DEFAULT 'active' NOT NULL,
    \`created_at\` text DEFAULT CURRENT_TIMESTAMP,
    \`ended_at\` text,
    FOREIGN KEY (\`topic_id\`) REFERENCES \`topics\`(\`id\`) ON UPDATE no action ON DELETE no action
  )`,
  `CREATE INDEX IF NOT EXISTS \`idx_dialog_sessions_topic\` ON \`dialog_sessions\` (\`topic_id\`)`,
  // dialog_logs
  `CREATE TABLE IF NOT EXISTS \`dialog_logs\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`session_id\` text NOT NULL,
    \`topic_id\` text NOT NULL,
    \`speaker\` text NOT NULL,
    \`text\` text NOT NULL,
    \`source\` text,
    \`created_at\` text DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (\`session_id\`) REFERENCES \`dialog_sessions\`(\`id\`) ON UPDATE no action ON DELETE no action,
    FOREIGN KEY (\`topic_id\`) REFERENCES \`topics\`(\`id\`) ON UPDATE no action ON DELETE no action
  )`,
  `CREATE INDEX IF NOT EXISTS \`idx_dialog_logs_session\` ON \`dialog_logs\` (\`session_id\`)`,
  `CREATE INDEX IF NOT EXISTS \`idx_dialog_logs_topic_created\` ON \`dialog_logs\` (\`topic_id\`,\`created_at\`)`,
  // materials
  `CREATE TABLE IF NOT EXISTS \`materials\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`topic_id\` text NOT NULL,
    \`type\` text NOT NULL,
    \`content\` text NOT NULL,
    \`vectorize_id\` text,
    \`created_at\` text DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (\`topic_id\`) REFERENCES \`topics\`(\`id\`) ON UPDATE no action ON DELETE no action
  )`,
  `CREATE INDEX IF NOT EXISTS \`idx_materials_topic\` ON \`materials\` (\`topic_id\`)`,
  // 0001: add video_url
  `ALTER TABLE \`topics\` ADD COLUMN \`video_url\` text`,
];

let migrated = false;

export function setupTestDatabase() {
  beforeAll(async () => {
    if (!migrated) {
      for (const sql of MIGRATION_STATEMENTS) {
        try {
          await env.DB.prepare(sql).run();
        } catch {
          // Ignore "duplicate column" or "table already exists" errors on re-run
        }
      }
      migrated = true;
    }
  });

  afterEach(async () => {
    await env.DB.prepare("PRAGMA foreign_keys = OFF").run();
    await env.DB.prepare("DELETE FROM dialog_logs").run();
    await env.DB.prepare("DELETE FROM dialog_sessions").run();
    await env.DB.prepare("DELETE FROM audience_voices").run();
    await env.DB.prepare("DELETE FROM materials").run();
    await env.DB.prepare("DELETE FROM topics").run();
    await env.DB.prepare("PRAGMA foreign_keys = ON").run();
  });
}
