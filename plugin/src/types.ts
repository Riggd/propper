export type PluginState = "idle" | "auditing" | "result" | "empty";

export type RequirementLevel = "error" | "warning" | "info";

export interface FigmaComponentProperty {
  type: "BOOLEAN" | "VARIANT" | "TEXT" | "INSTANCE_SWAP";
  value: boolean | string;
}

export interface CodeOnlyPropEntry {
  name: string;
  value: string;
}

export interface ExtractedComponentData {
  id: string;
  name: string;
  type: string;
  componentProperties?: Record<string, FigmaComponentProperty>;
  codeOnlyPropsFrame?: CodeOnlyPropEntry[];
}

export interface AuditFinding {
  type: RequirementLevel;
  check: "props" | "a11y" | "tokens";
  message: string;
  autoFixData?: {
    fixType: "ADD_COMPONENT_PROPERTY" | "ADD_CODE_ONLY_PROP_LAYER";
    propName: string;
    propType?: string;
    defaultValue?: string | boolean;
    propCategory?: string;
    figmaPropType?: "TEXT" | "BOOLEAN" | "none";
  };
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

// Messages from UI → Plugin main thread
export type UIToMain =
  | { type: "GET_COMPONENT_DATA" }
  | { type: "SCAFFOLD"; payload: { findings: AuditFinding[] } }
  | { type: "RESIZE"; payload: { width: number; height: number } };

// Messages from Plugin main thread → UI
export type MainToUI =
  | { type: "COMPONENT_DATA"; payload: ExtractedComponentData }
  | { type: "NO_SELECTION" }
  | { type: "SELECTION_CHANGED" }
  | { type: "SELECTION_CLEARED" }
  | { type: "SCAFFOLD_DONE" }
  | { type: "SCAFFOLD_ERROR"; payload: { message: string } };
