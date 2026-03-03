-- Add push token array support for multi-device notifications
ALTER TABLE "users"
ADD COLUMN "push_tokens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
