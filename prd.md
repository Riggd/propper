---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments: ['_bmad-output/planning-artifacts/product-brief-proper-2026-02-06.md', '_bmad-output/planning-artifacts/brainstorming.md']
documentCounts:
  briefCount: 1
  researchCount: 0
  brainstormingCount: 1
  projectDocsCount: 0
classification:
  projectType: 'Developer Tool'
  domain: 'Design Infrastructure'
  complexity: 'Medium'
  projectContext: 'greenfield'
workflowType: 'prd'
---

# Product Requirements Document - Propper

**Author:** Derek
**Date:** 2026-02-07T00:29:14-05:00

## Executive Summary

**Propper** is an AI-powered bridge between design and engineering that ensures Figma components are "code-ready" before they ever leave the design tool. By leveraging bi-directional MCP connectivity, Propper audits Figma components against code-level requirements—checking for missing states, accessibility attributes, token misalignment, and composition gaps. It replaces manual checklists and "hidden layer" hacks with an intelligent, automated guardian that empowers designers to deliver engineering-grade assets, eliminating the 60-70% of component definition that is typically lost in handoff.

## Success Criteria

### User Success

*   **Engineering Confidence:** Designers run Propper audits on >80% of new components before handoff.
*   **Reduced Friction:** Designers use the "Auto-Scaffold" feature to fix >50% of specific accessibility and property gaps.
*   **Empowerment:** Designers feel more confident that their assets are production-ready.

### Business Success

*   **Handoff Velocity:** 30% reduction in "return to sender" requests from engineering due to missing component states or properties.
*   **Adoption Friction:** Achieve < 2 minutes "Time to First Audit" via keyless entry.
*   **Consistency:** Maintenance of a unified source of truth for component requirements via the `rules.json`.

### Technical Success

*   **Low Latency:** Audit results return in < 5 seconds.
*   **High Accuracy:** 100% correct identification of missing props in the "Golden Master" test suite.
*   **Reliability:** 99.9% uptime for the Vercel Proxy during the hackathon period.
*   **Zero-False Positives:** No incorrect error reports for components that meet the standard.

### Measurable Outcomes

*   Successful side-by-side demo: Figma audit -> Auto-Scaffold -> Code audit PASS.
*   Audit of at least the "Big 3" components (Button, Input, Card).

## Product Scope

### MVP - Minimum Viable Product

*   **Rules Engine:** JSON schema driven validation for Button, Input, and Card.
*   **Figma Plugin:** 4 UI states (Idle, Auditing, Result, Empty) with one-click Auto-Scaffold.
*   **Vercel Proxy:** Stateless API handling plugin-to-LLM/knowledge communication.
*   **CLI Skill:** Developer implementation audit tool.

### Growth Features (Post-MVP)

*   **Check 3 (Auto-Update):** Deep bi-directional write-back to Figma layers.
*   **CI/CD Integration:** Automated drift detection in GitHub Actions.
*   **Full Library Support:** Support for entire ShadCN or standard WAI-ARIA libraries.

### Vision (Future)

*   **Propper Cloud:** Team accounts, audit history, and custom rule builders.
*   **AST Parsing:** Direct code analysis beyond JSON definitions.
*   **Universal Framework Support:** Support for Vue, Svelte, and Angular.

## User Journeys

### 🎭 Narrative Journeys

#### 1. Alex (The Product Designer) - The "Safe Handoff"
*   **Opening Scene:** Alex is finishing a "Multi-Select" component. They feel the usual anxiety: *"Did I forget the disabled state? Is the accessibility label there?"*
*   **Rising Action:** Alex selects the component and opens the Propper Plugin. They click "Audit."
*   **Climax:** Propper flags a missing `disabled` variant and `aria-label` prop. Alex clicks **"Auto-Scaffold."** Propper instantly generates the hidden "Code Only Props" layers. Alex fills in the missing value.
*   **Resolution:** The audit turns Green. Alex hands off the Figma link to Engineering with 100% confidence.

#### 2. Sam (The Developer) - The "No-Questions" Implementation
*   **Opening Scene:** Sam receives a handoff link. Usually, this means days of "ping-pong" with Alex about focus states and accessibility.
*   **Rising Action:** Sam runs `propper audit <URL>` in their terminal CLI.
*   **Climax:** The CLI returns `PASS` because Alex already fixed the gaps. Sam opens Figma and sees the explicit "Code Only Props" frame clearly defining the component's API.
*   **Resolution:** Sam builds the component in one go. No Slack threads, no guessing, just code.

#### 3. Morgan (The Design Systems Lead) - The "Automated Standard"
*   **Opening Scene:** Morgan needs to enforce a new `loading` state requirement across the design system.
*   **Rising Action:** Morgan updates the central `rules.json` on the Vercel Proxy.
*   **Climax:** Instantly, every designer running Propper on a Button component is notified if the state is missing.
*   **Resolution:** Propper acts as Morgan's "Automated Gatekeeper," ensuring library-wide consistency without manual policing.

### 📋 Journey Requirements Summary

These journeys reveal the following critical capabilities:
*   **Figma Plugin:** Selective layer extraction, iterative "Audit" states, and bi-directional layer creation for "Auto-Scaffold."
*   **Stateless Proxy:** A stable endpoint to serve the `rules.json` and proxy LLM requests (using the system prompt as the "brain").
*   **CLI Skill:** A Figma REST API fetcher that interprets the same "Code Only Props" layer structure as the Plugin.

## Domain-Specific Requirements

### 1. Rules Engine (JSON Schema)
The Rules Engine defines the source of truth for component audits. It must be strictly typed to ensure consistency between the Plugin and the CLI Skill.

*   **Schema Principles:**
    *   **Component-Driven:** Definitions for `Button`, `Input`, `Card`, etc.
    *   **Requirement Types:** `Error` (blocks handoff), `Warning` (recommended), `Info` (contextual).
    *   **Property Mapping:** Explicit mapping of Figma property names (e.g., `Variant`) to Code property names (e.g., `variant`).
    *   **State Validation:** Boolean checks for `disabled`, `loading`, and `error` states.

### 2. Figma Plugin UI (States)
The Plugin UI must be lightweight and context-aware, following a clear state machine:

*   **[Idle]:** Initial state. Encourages the designer to select a component layer.
*   **[Auditing]:** Triggered on click. Shows a simple "Analyzing Component..." animation with a progress indicator for the 3-check audit (Props, Tokens, A11y).
*   **[Result]:** The primary interaction state. Displays the scorecard (Pass/Fail) and the actionable **"Auto-Scaffold"** button for missing props.
*   **[Empty]:** Fallback state when no valid component is selected or recognized.

### 3. API Contract (Plugin ↔ Proxy)
The communication between the Figma Plugin and the Vercel Proxy utilizes a stateless JSON protocol.

*   **Request Payload:**
    *   `componentData`: Full Figma layer JSON (extracted via Plugin API).
    *   `context`: Project ID or optional framework choice (e.g., ShadCN).
*   **Proxy Logic:**
    *   The Proxy fetches the latest `rules.json`.
    *   It executes the LLM audit prompt using the Knowledge Base context.
*   **Response Payload:**
    *   `score`: Numeric completion score.
    *   `findings`: Array of objects containing `type`, `message`, and `autoFixData` (JSON snippet for layer generation).

## Innovation & Novel Patterns

### Detected Innovation Areas

*   **Pre-Handoff "Auto-Scaffold":** Unlike typical design-to-code tools, Propper focuses on "importing" engineering-grade metadata (like ARIA labels and reserved prop names) back into the Figma canvas. The "Auto-Scaffold" button automates the creation of the Nathan Curtis "Code Only Props" layer structure, solving the problem at the source.
*   **Knowledge-Driven Logic:** By leveraging the `southleft-ds-mcp` knowledge base, Propper's audit logic is not hardcoded. It dynamically "learns" the requirements of component types, ensuring that designers are always auditing against the latest industry best practices.
*   **Bi-Directional Context Bridge:** Propper is the first tool to enforce a unified `rules.json` that acts as the "Contract" for both the Figma Plugin and the Developer CLI Skill.

### Market Context & Competitive Landscape

Propper operates in the gap between static design linters and full code-connect tools. 
*   **Differentiation:** It is a "Pre-Handoff Guardian." It addresses the "invisible" 60-70% of component definitions (props that don't have visual variants) which are typically lost in translation.

### Validation Approach

The core innovative loop will be validated during the hackathon by:
1.  Auditing a flawed Figma component.
2.  Executing a one-click fix (Auto-Scaffold).
3.  Verifying the fix passes the Developer's CLI `propper-skill` check.

## Developer & CLI Tool Specifications

### 🛠️ CLI Command Structure (`propper-skill`)

The CLI is designed for speed and CI/CD integration.
*   **Primary Command:** `propper audit <figma-url>`
*   **Configuration:** Supports a local `propper.config.json` for persistent settings (e.g., default framework, target tokens).
*   **Output Formats:**
    *   **Terminal (Default):** Human-readable terminal output (colored text).
    *   **`--json`:** For machine processing and custom automation.
    *   **`--markdown`:** Formatted for easy pasting into GitHub/GitLab PR comments.
*   **Installation:** Distributed via `npm install -g @proper/cli`.

### 📦 Proxy & API Surface

The Vercel Proxy acts as the gateway to the Knowledge Base and LLM logic.
*   **Target Frameworks:** Initial support prioritized for **React + TypeScript + Tailwind/ShadCN**.
*   **API Documentation:** A minimalist `/docs` endpoint providing a schema for the Rules Engine and example request/response pairs for third-party integrations.
*   **Statelessness:** No database dependency; all context is derived from the inbound Figma layer JSON and the central `rules.json`.
*   **Security:** Keyless proxy logic for the hackathon, leveraging Vercel environment variables for LLM API keys.

## Functional Requirements

### 1. Figma Plugin (Interaction)
*   **FR-P01:** The Plugin MUST allow the designer to select a specific Figma component layer for auditing.
*   **FR-P02:** The Plugin MUST visually indicate an "Auditing" state (e.g., spinner/loader) while communicating with the Proxy.
*   **FR-P03:** The Plugin MUST display a scorecard interface showing Pass/Fail status for Props, Tokens, and Accessibility checks.
*   **FR-P04:** The Plugin MUST provide an "Auto-Scaffold" button for any component missing required property layers.
*   **FR-P05:** The Plugin MUST generate the specific "Code Only Props" hidden frame structure (as defined by Nathan Curtis methodology) when "Auto-Scaffold" is clicked.
*   **FR-P06:** The Plugin MUST gracefully handle empty states (no selection) by prompting the user to select a component.

### 2. Rules Engine (Logic)
*   **FR-RE01:** The Rules Engine MUST validate component JSON against a strict schema for `Button`, `Input`, and `Card` components.
*   **FR-RE02:** The Rules Engine MUST detect the absence of required boolean states (`disabled`, `loading`, `error`).
*   **FR-RE03:** The Rules Engine MUST detect the absence of accessibility properties (`accessibilityLabel`, `aria-label`).
*   **FR-RE04:** The Rules Engine MUST flag "Hardcoded Values" that do not map to known Design System tokens (e.g., `8px` vs `radius.md`).
*   **FR-RE05:** The Rules Engine MUST support requirement levels (Error, Warning, Info) to distinguish between blocking and non-blocking issues.

### 3. Proxy & API (Connectivity)
*   **FR-API01:** The Proxy MUST expose a secure endpoint to accept Figma layer JSON payloads.
*   **FR-API02:** The Proxy MUST serve the latest `rules.json` configuration file to authenticated clients.
*   **FR-API03:** The Proxy MUST sanitize input data to ensure no PII (Private Identifiable Information) or irrelevant hidden layer data is processed by the LLM.
*   **FR-API04:** The Proxy MUST return a structured JSON response containing the Audit Score, Findings List, and Auto-Fix Data.

### 4. Developer CLI (Verification)
*   **FR-CLI01:** The CLI MUST be callable via terminal command `propper audit <figma-url>`.
*   **FR-CLI02:** The CLI MUST authenticate with Figma using a personal access token (configured via env var).
*   **FR-CLI03:** The CLI MUST fetch the live component data from Figma's REST API.
*   **FR-CLI04:** The CLI MUST execute the same audit logic (via the Proxy or shared library) as the Plugin to ensure parity.
*   **FR-CLI05:** The CLI MUST output the audit results in human-readable text format (PASS/FAIL) to the console.

## Non-Functional Requirements

### Performance
*   **NFR-01 (Magic Feel):** "Auto-Scaffold" operations MUST complete in **< 1000ms** to ensure the plugin feels responsive and "magic" to the designer.
*   **NFR-02 (Audit Speed):** A full component audit (Plugin -> Proxy -> LLM -> Plugin) MUST complete in **< 5 seconds** (p95) to maintain the user's flow.

### Security
*   **NFR-03 (Data Ephemerality):** The Proxy MUST NOT persist any Figma layer data to disk or database. All processing is transient and stateless.
*   **NFR-04 (Keyless Entry):** The Plugin MUST NOT require user account creation. It should function immediately upon installation (authentication is handled via shared secrets or trusted domains for the hackathon).
*   **NFR-05 (Secret Management):** LLM Provider keys MUST be injected via server-side Environment Variables and NEVER exposed in the client-side bundle.

### Reliability (Demo Standard)
*   **NFR-06 (Demo Stability):** The Proxy MUST handle up to 50 concurrent requests without crashing or timing out (to ensuring stability during live demos and judging).
