# Overview

This is a JIRA Task Decomposition Tool that automatically analyzes and breaks down JIRA tasks into subtasks using AI/LLM technology. The application integrates with JIRA APIs to fetch task details, uses OpenAI or Anthropic APIs for intelligent text parsing, and automatically creates new linked tasks in JIRA with proper estimations and risk calculations.

The tool converts T-shirt size estimations (XS, S, M, L, XL) to Story Points, manages risk assessments, calculates delivery timelines, and provides a modern React-based interface for task management workflows.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state management and caching
- **UI Components**: Custom component library built on Radix UI primitives with Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Styling**: Tailwind CSS with CSS custom properties for theming and design system consistency

## Backend Architecture
- **Runtime**: Node.js 20+ with Express.js framework
- **API Design**: RESTful endpoints with structured JSON responses
- **Service Layer**: Modular service architecture with JiraService, LLMService, and EstimationService
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes
- **Configuration**: Environment-based configuration with dotenv

## Data Processing Pipeline
- **Text Analysis**: Multi-provider LLM integration (OpenAI, Anthropic) with fallback to regex parsing
- **Estimation Mapping**: Configurable T-shirt size to Story Points conversion via JSON configuration
- **Risk Calculation**: Automated risk assessment with customizable additional risk percentages
- **Task Creation**: Bulk JIRA API operations for efficient subtask creation

## Build System
- **Development**: Vite for fast development server with HMR
- **TypeScript**: Strict type checking across client, server, and shared modules
- **Path Aliases**: Configured path mapping for clean imports
- **Production**: ESBuild for optimized server bundling

# External Dependencies

## JIRA Integration
- **JIRA REST API**: Complete integration for task fetching, field reading, and bulk task creation
- **Authentication**: Token-based authentication with configurable JIRA host
- **Custom Fields**: Support for JIRA custom fields including decomposition text, estimations, and story points

## AI/LLM Services
- **OpenAI API**: Primary LLM provider for intelligent text decomposition analysis
- **Anthropic Claude**: Alternative LLM provider for text analysis with automatic fallback
- **Provider Flexibility**: Multi-provider architecture allowing runtime provider selection

## UI Component Libraries
- **Radix UI**: Accessible, unstyled UI primitives for components like tooltips, toasts, and form controls
- **Lucide React**: Consistent icon library for UI elements
- **Class Variance Authority**: Type-safe component variant management

## Development Tools
- **Replit Integration**: Specialized Vite plugins for Replit development environment
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer
- **ESLint/TypeScript**: Code quality and type safety tooling