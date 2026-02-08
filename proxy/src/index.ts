import express from "express";
import cors from "cors";
import { auditComponent } from "./engine";
import type { RulesSchema, FigmaComponentData } from "./types";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const rules: RulesSchema = require("../rules.json");

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Request sanitizer — strips hidden layer data not relevant to audit
function sanitizeComponentData(data: FigmaComponentData): FigmaComponentData {
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    componentProperties: data.componentProperties,
    codeOnlyPropsFrame: data.codeOnlyPropsFrame,
  };
}

/**
 * POST /audit
 * Body: { componentData: FigmaComponentData, context?: { framework?: string } }
 * Returns: AuditResult
 */
app.post("/audit", (req, res) => {
  const { componentData, context } = req.body;

  if (!componentData || !componentData.name) {
    res.status(400).json({
      error: "Invalid payload: componentData with name is required",
    });
    return;
  }

  const sanitized = sanitizeComponentData(componentData);
  const result = auditComponent(sanitized, context, rules);
  res.json(result);
});

/**
 * GET /rules
 * Returns the current rules.json configuration
 */
app.get("/rules", (_req, res) => {
  res.json(rules);
});

/**
 * GET /docs
 * Returns API documentation and schema examples
 */
app.get("/docs", (_req, res) => {
  const componentSummary: Record<string, { matchPatterns: string[]; requiredProps: number; codeOnlyProps: number }> = {};
  for (const [name, rule] of Object.entries(rules.components)) {
    componentSummary[name] = {
      matchPatterns: rule.matchPatterns,
      requiredProps: rule.requiredBooleanProps.length,
      codeOnlyProps: rule.codeOnlyProps.length,
    };
  }

  res.json({
    version: rules.version,
    sources: rules.sources || [],
    endpoints: {
      "POST /audit": {
        description: "Audit a Figma component against the rules engine",
        requestBody: {
          componentData: {
            id: "string",
            name: "string (e.g. 'Button/Primary', 'Checkbox/Default', 'Modal/Confirmation')",
            type: "string (e.g. 'COMPONENT')",
            componentProperties:
              "Record<string, { type: 'BOOLEAN'|'VARIANT'|'TEXT', value: boolean|string }>",
            codeOnlyPropsFrame:
              "Array<{ name: string, value: string }> — extracted from _Code Only Props hidden frame",
          },
          context: {
            framework: "optional string (e.g. 'react-shadcn')",
          },
        },
        response: {
          score: "number (0-100)",
          componentType: "string",
          checks: {
            props: "{ pass: boolean, total: number, passed: number }",
            a11y: "{ pass: boolean, total: number, passed: number }",
            tokens: "{ pass: boolean, total: number, passed: number }",
          },
          findings:
            "Array<{ type: 'error'|'warning'|'info', check: string, message: string, autoFixData?: { fixType, propName, ... } }>",
        },
      },
      "GET /rules": {
        description: "Returns the current rules.json configuration",
      },
    },
    supportedComponents: Object.keys(rules.components),
    componentDetails: componentSummary,
  });
});

app.listen(PORT, () => {
  console.log(`Propper proxy running at http://localhost:${PORT}`);
  console.log(`  POST /audit  — audit a component`);
  console.log(`  GET  /rules  — view rules dictionary`);
  console.log(`  GET  /docs   — API documentation`);
});
