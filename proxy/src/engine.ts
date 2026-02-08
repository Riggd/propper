import type {
  RulesSchema,
  FigmaComponentData,
  AuditResult,
  AuditFinding,
} from "./types";

/**
 * Identifies which component type a Figma node matches based on its name.
 * Matches are case-insensitive against each component's matchPatterns.
 */
function identifyComponent(
  nodeName: string,
  rules: RulesSchema
): string | null {
  const name = nodeName.toLowerCase();
  for (const [componentType, rule] of Object.entries(rules.components)) {
    for (const pattern of rule.matchPatterns) {
      if (new RegExp(pattern, "i").test(name)) {
        return componentType;
      }
    }
  }
  return null;
}

/**
 * Normalizes Figma component property keys to lowercase for case-insensitive matching.
 * Strips the uniqueness suffix Figma appends (e.g. "aria-label#12345" → "aria-label").
 */
function normalizeProps(
  props: Record<string, { type: string; value: unknown }> = {}
): Set<string> {
  return new Set(
    Object.keys(props).map((k) => k.toLowerCase().replace(/#\d+$/, ""))
  );
}

/**
 * Runs the rules engine audit against a Figma component's extracted data.
 */
export function auditComponent(
  componentData: FigmaComponentData,
  _context: unknown,
  rules: RulesSchema
): AuditResult {
  const componentType = identifyComponent(componentData.name, rules);

  if (!componentType) {
    return {
      score: 0,
      componentType: "unknown",
      checks: {
        props: { pass: false, total: 0, passed: 0 },
        a11y: { pass: false, total: 0, passed: 0 },
        tokens: { pass: true, total: 0, passed: 0 },
      },
      findings: [
        {
          type: "error",
          check: "props",
          message: `Component "${componentData.name}" does not match any known component type (Button, Input, Card).`,
        },
      ],
    };
  }

  const componentRules = rules.components[componentType];
  const findings: AuditFinding[] = [];
  const existingProps = normalizeProps(componentData.componentProperties);
  const documentedCodeProps = new Set(
    (componentData.codeOnlyPropsFrame || []).map((p) => p.name.toLowerCase())
  );

  // --- Check 1: Required Boolean Props (component properties in Figma) ---
  let propTotal = componentRules.requiredBooleanProps.length;
  let propPassed = 0;

  for (const rule of componentRules.requiredBooleanProps) {
    const found = existingProps.has(rule.name.toLowerCase());
    if (found) {
      propPassed++;
    } else {
      findings.push({
        type: rule.level,
        check: "props",
        message: `Missing boolean component property: "${rule.name}"${rule.description ? ` — ${rule.description}` : ""}`,
        autoFixData: {
          fixType: "ADD_COMPONENT_PROPERTY",
          propName: rule.name,
          propType: "BOOLEAN",
          defaultValue: false,
        },
      });
    }
  }

  // --- Check 2: A11y Code-Only Props ---
  const a11yProps = componentRules.codeOnlyProps.filter(
    (p) => p.category === "a11y"
  );
  let a11yTotal = a11yProps.length;
  let a11yPassed = 0;

  for (const rule of a11yProps) {
    const documented = documentedCodeProps.has(rule.name.toLowerCase());
    if (documented) {
      a11yPassed++;
    } else {
      findings.push({
        type: rule.level,
        check: "a11y",
        message: `Missing a11y code-only prop: "${rule.name}"${rule.description ? ` — ${rule.description}` : ""}`,
        autoFixData: {
          fixType: "ADD_CODE_ONLY_PROP_LAYER",
          propName: rule.name,
          propCategory: rule.category,
          defaultValue: rule.defaultValue || "",
          figmaPropType: rule.figmaPropType,
        },
      });
    }
  }

  // Check non-a11y code-only props (events, tech, config) under props check
  const otherCodeProps = componentRules.codeOnlyProps.filter(
    (p) => p.category !== "a11y"
  );
  propTotal += otherCodeProps.length;

  for (const rule of otherCodeProps) {
    const documented = documentedCodeProps.has(rule.name.toLowerCase());
    if (documented) {
      propPassed++;
    } else {
      findings.push({
        type: rule.level,
        check: "props",
        message: `Missing code-only prop: "${rule.name}" (${rule.category})${rule.description ? ` — ${rule.description}` : ""}`,
        autoFixData: {
          fixType: "ADD_CODE_ONLY_PROP_LAYER",
          propName: rule.name,
          propCategory: rule.category,
          defaultValue: rule.defaultValue || "",
          figmaPropType: rule.figmaPropType,
        },
      });
    }
  }

  // --- Check 3: Token Validation (simplified — checks if hardcoded values exist) ---
  // For MVP, tokens check is informational — always passes
  const tokenFindings: AuditFinding[] = [];
  const tokenTotal = 0;
  const tokenPassed = 0;

  // --- Scoring ---
  const totalChecks = propTotal + a11yTotal + tokenTotal;
  const totalPassed = propPassed + a11yPassed + tokenPassed;
  const errorCount = findings.filter((f) => f.type === "error").length;

  const score =
    totalChecks > 0 ? Math.round((totalPassed / totalChecks) * 100) : 100;

  return {
    score,
    componentType,
    checks: {
      props: { pass: errorCount === 0, total: propTotal, passed: propPassed },
      a11y: {
        pass: a11yPassed === a11yTotal,
        total: a11yTotal,
        passed: a11yPassed,
      },
      tokens: {
        pass: true,
        total: tokenTotal,
        passed: tokenPassed,
      },
    },
    findings: [...findings, ...tokenFindings],
  };
}
