
-- Increase statement timeout for complex queries
-- Default is usually 2 seconds, we'll increase to 10 seconds for better reliability
ALTER DATABASE postgres SET statement_timeout = '10s';

-- Also set it for the current session
SET statement_timeout = '10s';

-- Add comment
COMMENT ON DATABASE postgres IS 'Statement timeout increased to 10s to handle complex queries with large datasets';
