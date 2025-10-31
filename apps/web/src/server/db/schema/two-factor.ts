import { sql } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { users } from "./users"

/**
 * Two-Factor Authentication table for Better Auth plugin
 * Stores TOTP secrets and backup codes for user accounts
 *
 * SECURITY (QA SEC-003):
 * - TOTP secrets are encrypted by better-auth using AES-256-GCM before storage
 * - Encryption key is derived from BETTER_AUTH_SECRET environment variable
 * - Backup codes are hashed using bcrypt before storage
 * - better-auth automatically handles encryption/decryption on read/write
 * - RFC 6238 compliant TOTP implementation
 *
 * References:
 * - https://www.better-auth.com/docs/plugins/2fa
 * - RFC 6238: TOTP Time-Based One-Time Password Algorithm
 */
export const twoFactor = pgTable("two_factor", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  secret: text("secret"), // TOTP secret (AES-256-GCM encrypted by better-auth)
  backupCodes: text("backup_codes"), // Backup codes (bcrypt hashed, JSON array)
  createdAt: timestamp("created_at")
    .default(sql`current_timestamp`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`current_timestamp`)
    .notNull(),
})

export type TwoFactor = typeof twoFactor.$inferSelect
