# Propper

> Because your Figma components deserve a proper upbringing.

Propper audits Figma components for code-readiness before handoff — checking for missing props, accessibility attributes, and code-only documentation. No more improper components making it to production.

## Have a proper good time

```bash
# Start the rules engine
cd proxy && npm install && npm run dev
# → http://localhost:3333

# Run the Figma plugin (requires Figma Desktop)
cd plugin && npm install && npm run dev

# Or audit from the CLI
cd cli && npm install
export FIGMA_TOKEN=your_token
npx tsx cli/src/index.ts audit "https://www.figma.com/file/..."
```

## What it does

- **Audits** components against a rules dictionary (`proxy/rules.json`)
- **Finds** missing boolean props, a11y attributes, and code-only prop documentation
- **Scaffolds** fixes directly into Figma — adds component properties and `_Code Only Props` frames
- **CI/CD ready** — CLI exits with code 1 on any `error`-level findings

## Packages

| Package | Description |
|---------|-------------|
| `proxy/` | Local Express rules engine (port 3333) |
| `plugin/` | Figma plugin (plugma + React + Tailwind) |
| `cli/` | Developer CLI for auditing from the terminal |

---

*Proper handoff. Proper components. Proper good time.*
