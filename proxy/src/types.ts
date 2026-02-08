export type RequirementLevel = "error" | "warning" | "info";

export interface BooleanPropRule {
  name: string;
  type: "BOOLEAN";
  level: RequirementLevel;
  description?: string;
}

export interface CodeOnlyPropRule {
  name: string;
  category: "event" | "a11y" | "tech" | "config";
  figmaPropType: "TEXT" | "BOOLEAN" | "none";
  level: RequirementLevel;
  defaultValue?: string;
  options?: string[];
  description?: string;
}

export interface ComponentRule {
  matchPatterns: string[];
  requiredBooleanProps: BooleanPropRule[];
  codeOnlyProps: CodeOnlyPropRule[];
}

export interface RulesSchema {
  version: string;
  updatedAt: string;
  components: Record<string, ComponentRule>;
}

export interface FigmaComponentProperty {
  type: "BOOLEAN" | "VARIANT" | "TEXT" | "INSTANCE_SWAP";
  value: boolean | string;
}

export interface FigmaComponentData {
  id: string;
  name: string;
  type: string;
  componentProperties?: Record<string, FigmaComponentProperty>;
  codeOnlyPropsFrame?: Array<{ name: string; value: string }>;
  children?: unknown[];
}

export interface AuditFinding {
  type: RequirementLevel;
  check: "props" | "a11y" | "tokens";
  message: string;
  autoFixData?: AutoFixData;
}

export interface AutoFixData {
  fixType: "ADD_COMPONENT_PROPERTY" | "ADD_CODE_ONLY_PROP_LAYER";
  propName: string;
  propType?: string;
  defaultValue?: string | boolean;
  propCategory?: string;
  figmaPropType?: "TEXT" | "BOOLEAN" | "none";
}

export interface AuditResult {
  score: number;
  componentType: string;
  checks: {
    props: { pass: boolean; total: number; passed: number };
    a11y: { pass: boolean; total: number; passed: number };
    tokens: { pass: boolean; total: number; passed: number };
  };
  findings: AuditFinding[];
}
