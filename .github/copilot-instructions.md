# Copilot Instructions for Mona Mayhem

This document provides context for GitHub Copilot and other AI assistants working on the Mona Mayhem workshop project.

## Project Overview

**Mona Mayhem** is a GitHub Copilot workshop template—an interactive learning project, not a production application. The goal is to build a retro arcade-themed website that fetches and compares GitHub contribution graphs of two users.

- **Framework**: Astro v5
- **Runtime**: Node.js with @astrojs/node adapter (server mode)
- **TypeScript**: Strict mode enabled
- **Main Tech**: Fetch GitHub contribution data via API, render comparison UI with retro gaming aesthetic

## Build & Run Commands

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run arbitrary Astro commands
npm run astro [command]
```

## Project Architecture

### Core Structure

```
src/
  pages/
    index.astro          # Main landing/game page (entry point)
    api/
      contributions/[username].ts   # Dynamic API endpoint for GitHub data
public/
  favicon.svg            # Branding assets
```

### Key Design Patterns

1. **File-Based Routing**: Astro uses file/directory structure to define routes
   - `src/pages/index.astro` → `/`
   - `src/pages/api/contributions/[username].ts` → `/api/contributions/{username}`
   - Dynamic segments use `[param]` syntax; accessed via `params.param` in handlers

2. **Server-Side Rendering**: Astro configured with `output: 'server'` and Node adapter
   - Pages and API routes run on the server
   - `prerender = false` disables static pre-rendering for dynamic routes

3. **TypeScript Integration**: Astro's strict tsconfig validates all files
   - Astro component files use `---` frontmatter for script logic
   - Import statements and type annotations follow TypeScript conventions

### Current Implementation Status

- **Homepage** (`src/pages/index.astro`): Basic welcome scaffold
- **API Endpoint** (`src/pages/api/contributions/[username].ts`): Stub with TODO—needs GitHub data fetching logic
  - Should fetch contribution graph data from GitHub for a given username
  - Returns JSON response with contribution data or error

## Key Conventions

1. **TypeScript Strict Mode**: All code must pass strict type checking (configured in tsconfig.json)
   - Type all function parameters and return values
   - Avoid `any` types; use `unknown` with type guards if needed

2. **Astro File Format**: Astro component files (`.astro`) use YAML frontmatter
   - Script between `---` delimiters executes server-side only
   - HTML/template below the frontmatter
   - Import statements go in the frontmatter script block

3. **API Route Structure**: Dynamic routes use bracket notation for parameters
   - Access route parameters via `params` object in handler
   - API routes export `GET`, `POST`, etc. as `APIRoute` functions
   - Return `Response` objects with proper headers and status codes

4. **ESM Module System**: Package.json specifies `"type": "module"`
   - Use ES6 `import`/`export` syntax throughout
   - No CommonJS `require()` calls

## Important Notes

- This is a learning project designed for workshop participants to practice with GitHub Copilot
- The GitHub contribution graph data source (URL pattern: `https://github.com/{username}.contribs`) needs to be researched and implemented
- Focus on readable, educational code—the goal is learning Copilot workflows, not production optimization
- The retro arcade theme is applied through CSS/styling, not reflected in the TypeScript/Astro code structure
