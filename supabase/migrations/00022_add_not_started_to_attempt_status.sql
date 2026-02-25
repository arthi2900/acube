-- Add 'not_started' to attempt_status enum
ALTER TYPE attempt_status ADD VALUE IF NOT EXISTS 'not_started';