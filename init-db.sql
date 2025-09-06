-- Initialize database for JIRA Task Decomposition
-- This file is automatically executed when the database container starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial tables (will be managed by Drizzle migrations)
-- This is just to ensure the database is properly initialized