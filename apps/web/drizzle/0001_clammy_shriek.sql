-- Add unique index for session tokens to prevent duplicate tokens
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);