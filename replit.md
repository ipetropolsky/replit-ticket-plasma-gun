# Overview

This is a JIRA task decomposition application built with React, TypeScript, Express, and Drizzle ORM. The application helps users break down JIRA tasks into smaller subtasks by parsing decomposition text using AI/LLM services, calculating estimations in story points, and automatically creating new JIRA issues.

The core workflow involves:
1. Entering a JIRA task key or URL to fetch task details
2. Parsing the "Декомпозиция" (Decomposition) field using LLM to identify subtasks
3. Calculating estimations and risks based on configurable T-shirt sizing (XS, S, M)
4. Creating multiple related JIRA issues with proper linking and metadata

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** as the build tool and development server
- **TanStack Query** for server state management and API caching
- **Wouter** for lightweight client-side routing
- **Tailwind CSS** with shadcn/ui components for consistent styling
- **React Hook Form** with Zod validation for form handling

## Backend Architecture
- **Express.js** server with TypeScript
- **Service-oriented architecture** with separate services for:
  - `JiraService`: JIRA API integration and issue management
  - `LLMService`: OpenAI integration for text parsing and task identification
  - `EstimationService`: Story point calculations and risk assessment
- **RESTful API design** with structured error handling
- **Session-based workflow** tracking decomposition progress

## Data Storage Solutions
- **PostgreSQL** database with Drizzle ORM for type-safe database operations
- **Neon Database** as the serverless PostgreSQL provider
- Database schema includes:
  - `users`: Basic user authentication
  - `decomposition_sessions`: Tracks the complete decomposition workflow from JIRA fetch to task creation
- **In-memory storage fallback** for development environments

## Authentication and Authorization
- **Basic authentication** system with username/password
- **Session management** using connect-pg-simple for PostgreSQL session storage
- **JIRA API authentication** via Basic Auth with username/token credentials

## External Dependencies

### Third-party Services
- **JIRA REST API**: Task fetching, field extraction, and issue creation
- **OpenAI API**: LLM-powered text parsing to identify tasks and estimations
- **Neon Database**: Serverless PostgreSQL hosting

### APIs and Integrations
- **JIRA API endpoints**: `/rest/api/2/issue/{issueKey}` for fetching tasks, `/rest/api/2/issue` for creating issues
- **OpenAI Chat Completions API**: For parsing decomposition text into structured task blocks
- **Environment-based configuration**: Supports custom OpenAI endpoints for alternative LLM providers

### Configuration Management
- **Estimation mapping**: JSON configuration file (`config/estimation-mapping.json`) for T-shirt size to story point conversion
- **Environment variables**: JIRA credentials, database URLs, OpenAI API keys
- **Development vs Production**: Different build processes and serving strategies

### Key Libraries
- **Drizzle ORM**: Type-safe database queries and migrations
- **Zod**: Runtime type validation and schema definition
- **Radix UI**: Accessible component primitives
- **Date-fns**: Date manipulation and working day calculations
- **Class Variance Authority**: Utility-first component styling patterns