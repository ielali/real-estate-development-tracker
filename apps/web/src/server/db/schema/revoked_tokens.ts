/**
 * Revoked Tokens Schema
 * Story 8.2: QA Fix - Token revocation mechanism
 *
 * Tracks revoked JWT tokens (e.g., unsubscribe tokens) to prevent reuse
 */

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { users } from "./users"

export const revokedTokens = pgTable("revoked_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  // JWT ID (jti claim) - unique identifier for each token
  jti: text("jti").notNull().unique(),
  // User ID - who the token belongs to
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Token purpose (unsubscribe, password_reset, etc.)
  purpose: text("purpose").notNull(),
  // When the token was revoked
  revokedAt: timestamp("revoked_at").notNull().defaultNow(),
  // When the token expires (for cleanup - can delete revoked tokens after expiry)
  expiresAt: timestamp("expires_at").notNull(),
  // Optional reason for revocation
  reason: text("reason"),
})
