# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Proxy (local rules engine server)
```bash
cd proxy && npm install && npm run dev   # starts on http://localhost:3333
```

### Figma Plugin
```bash
cd plugin && npm install && npm run dev  # plugma dev server with HMR
cd plugin && npm run build               # production build → dist/
```

### CLI
```bash
cd cli && npm install
export FIGMA_TOKEN=your_personal_access_token
npx tsx cli/src/index.ts audit "https://www.figma.com/file/..."
```

## Architecture

Three independent packages in a monorepo workspace (`proxy/`, `plugin/`, `cli/`).

### Data Flow
1. Designer selects a Figma component → plugin main thread (`plugin/src/main.ts`) extracts component properties and the hidden `_Code Only Props` frame
2. UI (`plugin/src/ui.tsx`) sends extracted data to the proxy via `POST /audit`
3. Proxy rules engine (`proxy/src/engine.ts`) validates against `proxy/rules.json`
4. Findings (with `autoFixData`) returned to plugin UI
5. If Auto-Scaffold clicked, UI sends findings back to main thread which creates Figma component properties and/or adds entries to the `_Code Only Props` hidden frame

### Plugin Architecture (plugma + React + Tailwind)
- `plugin/src/main.ts` — Figma sandbox (no DOM); communicates with UI via `figma.ui.postMessage` / `parent.postMessage`
- `plugin/src/ui.tsx` — React entry; renders a 4-state machine (Idle → Auditing → Result/Empty)
- `plugin/src/components/App.tsx` — owns all state, calls proxy, dispatches scaffold messages
- Plugin requires Figma Desktop app (or HTTPS proxy) due to mixed-content restrictions when calling `http://localhost:3333`

### Proxy Architecture (Express + TypeScript)
- `proxy/src/index.ts` — Express server with CORS, sanitizes input, serves 3 endpoints
- `proxy/src/engine.ts` — Pure rules engine: identifies component type by name pattern, checks boolean props + code-only props
- `proxy/rules.json` — Source of truth for all component rules (Button, Input, Card)

### Rules Schema
Each component in `rules.json` defines:
- `matchPatterns`: regex strings matched case-insensitively against the Figma layer name
- `requiredBooleanProps`: props that should exist as Figma component boolean properties (e.g., `disabled`, `loading`)
- `codeOnlyProps`: props that have no visual representation (events, a11y, tech, config) — must be documented in the `_Code Only Props` hidden frame

### Auto-Scaffold Strategy
- `ADD_COMPONENT_PROPERTY` findings → added as Figma boolean component properties (only on `COMPONENT` nodes)
- `ADD_CODE_ONLY_PROP_LAYER` findings → added as text entries (`propName: defaultValue`) to a hidden frame named `_Code Only Props`

### CLI Architecture
- `cli/src/index.ts` — Commander CLI; parses Figma URL, fetches node via Figma REST API, posts to proxy
- Requires `FIGMA_TOKEN` env var; supports `--json` and `--markdown` output formats
- Exits with code 1 if any `error`-level findings exist (CI/CD compatible)

## Git Workflow

- **Never push directly to `main`** — all changes go through pull requests
- Create a feature branch, push, and open a PR for every change

## Key Files
- `proxy/rules.json` — The component rules dictionary (source of truth; edit this to add/change requirements)
- `plugin/src/main.ts` — All Figma API interactions (extraction + scaffolding)
- `proxy/src/engine.ts` — Core audit logic
