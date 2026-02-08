/// <reference types="@figma/plugin-typings" />
import type {
  UIToMain,
  ExtractedComponentData,
  CodeOnlyPropEntry,
  AuditFinding,
} from "./types";

// Plugma requires a default export function as the entry point
export default function () {
  figma.showUI(__html__, { width: 360, height: 520, title: "Propper" });

  // --- Helpers ---

  /**
   * Extracts the text entries from the hidden "_Code Only Props" frame.
   */
  function extractCodeOnlyPropsFrame(
    node: FrameNode | ComponentNode | InstanceNode | ComponentSetNode
  ): CodeOnlyPropEntry[] {
    const entries: CodeOnlyPropEntry[] = [];
    if (!("children" in node)) return entries;

    // For COMPONENT_SET, inspect the first child COMPONENT since the frame
    // lives on individual variants (COMPONENT_SET only allows COMPONENT children)
    const searchTarget =
      node.type === "COMPONENT_SET"
        ? (node.children.find((c) => c.type === "COMPONENT") as ComponentNode | undefined)
        : node;

    if (!searchTarget) return entries;

    const codeFrame = searchTarget.children.find(
      (child) =>
        child.name.toLowerCase().startsWith("_code only props") ||
        child.name.toLowerCase().startsWith(".code only props") ||
        child.name.toLowerCase() === "code only props"
    );

    if (!codeFrame || codeFrame.type !== "FRAME") return entries;

    for (const child of codeFrame.children) {
      if (child.type === "TEXT") {
        // Prefer the layer name as the prop identifier (set by scaffold).
        // Fall back to parsing characters for legacy/manual entries.
        const layerName = child.name.trim();
        if (layerName.length > 0 && !layerName.startsWith("Text")) {
          entries.push({ name: layerName, value: child.characters.trim() });
        } else {
          const text = child.characters.trim();
          const colonIdx = text.indexOf(":");
          if (colonIdx > 0) {
            entries.push({
              name: text.slice(0, colonIdx).trim(),
              value: text.slice(colonIdx + 1).trim(),
            });
          } else if (text.length > 0) {
            entries.push({ name: text, value: "" });
          }
        }
      }
    }

    return entries;
  }

  /**
   * Extracts the minimal component data needed for auditing.
   */
  function extractComponentData(node: SceneNode): ExtractedComponentData {
    const data: ExtractedComponentData = {
      id: node.id,
      name: node.name,
      type: node.type,
    };

    // Extract component properties:
    // - ComponentNode and ComponentSetNode expose `componentPropertyDefinitions`
    // - InstanceNode exposes `componentProperties` (current values)
    if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
      const defs = node.componentPropertyDefinitions;
      const mapped: ExtractedComponentData["componentProperties"] = {};
      for (const [key, def] of Object.entries(defs)) {
        mapped[key] = {
          type: def.type as "BOOLEAN" | "VARIANT" | "TEXT" | "INSTANCE_SWAP",
          value: def.defaultValue as boolean | string,
        };
      }
      data.componentProperties = mapped;
    } else if (node.type === "INSTANCE") {
      data.componentProperties =
        node.componentProperties as ExtractedComponentData["componentProperties"];
    }

    // Look for _Code Only Props hidden frame
    if (
      node.type === "FRAME" ||
      node.type === "COMPONENT" ||
      node.type === "COMPONENT_SET" ||
      node.type === "INSTANCE"
    ) {
      data.codeOnlyPropsFrame = extractCodeOnlyPropsFrame(
        node as FrameNode | ComponentNode | InstanceNode | ComponentSetNode
      );
    }

    return data;
  }

  /**
   * Creates or finds the "_Code Only Props" hidden frame on the component.
   */
  function createCodeOnlyFrame(): FrameNode {
    const frame = figma.createFrame();
    frame.name = "_Code Only Props";
    frame.resize(0.01, 0.01);
    frame.locked = true;
    frame.layoutPositioning = "ABSOLUTE";
    frame.layoutMode = "VERTICAL";
    frame.itemSpacing = 4;
    frame.paddingLeft = 8;
    frame.paddingRight = 8;
    frame.paddingTop = 8;
    frame.paddingBottom = 8;
    frame.fills = [{ type: "SOLID", color: { r: 0.95, g: 0.98, b: 1 } }];
    return frame;
  }

  /**
   * Returns the target COMPONENT nodes to receive the _Code Only Props frame.
   * For COMPONENT_SET, returns all child COMPONENTs (each variant gets its own frame).
   * For COMPONENT/FRAME/INSTANCE, returns the node itself.
   */
  function getComponentTargets(
    node: ComponentNode | ComponentSetNode | FrameNode | InstanceNode
  ): Array<ComponentNode | FrameNode | InstanceNode> {
    if (node.type === "COMPONENT_SET") {
      return node.children.filter(
        (c): c is ComponentNode => c.type === "COMPONENT"
      );
    }
    return [node as ComponentNode | FrameNode | InstanceNode];
  }

  async function getOrCreateCodeOnlyPropsFrame(
    node: ComponentNode | FrameNode | InstanceNode
  ): Promise<FrameNode> {
    const existing = node.children.find(
      (child) => child.name === "_Code Only Props" && child.type === "FRAME"
    ) as FrameNode | undefined;

    if (existing) return existing;

    const frame = createCodeOnlyFrame();
    node.appendChild(frame);
    return frame;
  }

  /**
   * Adds a text node to the _Code Only Props frame.
   * Returns the node (new or existing) so callers can bind component properties.
   */
  async function addPropTextNode(
    frame: FrameNode,
    propName: string,
    content: string
  ): Promise<TextNode> {
    const existing = frame.children.find(
      (child) => child.type === "TEXT" && child.name === propName
    ) as TextNode | undefined;
    if (existing) return existing;

    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    const text = figma.createText();
    text.name = propName;
    text.fontName = { family: "Inter", style: "Regular" };
    text.characters = content;
    text.fontSize = 11;
    frame.appendChild(text);
    return text;
  }

  /**
   * Finds an existing component property key by prop name (case-insensitive).
   * Needed because addComponentProperty can suffix keys for uniqueness.
   */
  function findPropKey(
    node: ComponentNode | ComponentSetNode,
    propName: string
  ): string | null {
    const defs = node.componentPropertyDefinitions;
    return (
      Object.keys(defs).find((k) =>
        k.toLowerCase().startsWith(propName.toLowerCase())
      ) ?? null
    );
  }

  /**
   * Applies auto-fix data from audit findings to the Figma component.
   */
  async function scaffoldMissingProps(findings: AuditFinding[]): Promise<void> {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) throw new Error("No selection");

    const node = selection[0];

    for (const finding of findings) {
      if (!finding.autoFixData) continue;
      const { fixType, propName, propType, defaultValue, propCategory } =
        finding.autoFixData;

      if (fixType === "ADD_COMPONENT_PROPERTY") {
        // Boolean props live on the COMPONENT or COMPONENT_SET itself
        if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
          try {
            node.addComponentProperty(
              propName,
              propType as "BOOLEAN" | "TEXT" | "VARIANT",
              defaultValue ?? false
            );
          } catch {
            // Property may already exist
          }
        }
      } else if (fixType === "ADD_CODE_ONLY_PROP_LAYER") {
        // Code-only props must live on COMPONENT children, never on COMPONENT_SET
        // directly (COMPONENT_SET only accepts COMPONENT children)
        if (
          node.type === "COMPONENT" ||
          node.type === "COMPONENT_SET" ||
          node.type === "FRAME" ||
          node.type === "INSTANCE"
        ) {
          const { figmaPropType } = finding.autoFixData!;

          // Step 1: Add a native Figma component property and capture the key.
          // TEXT → designer types the value in the properties panel
          // BOOLEAN → designer toggles in the properties panel
          // none → event handlers / ref — no Figma property, frame only
          let propKey: string | null = null;
          if (
            (figmaPropType === "TEXT" || figmaPropType === "BOOLEAN") &&
            (node.type === "COMPONENT" || node.type === "COMPONENT_SET")
          ) {
            const propDefaultValue =
              figmaPropType === "BOOLEAN" ? false : String(defaultValue ?? "");
            try {
              propKey = node.addComponentProperty(
                propName,
                figmaPropType,
                propDefaultValue
              );
            } catch {
              // Already exists — look up the existing key so we can still bind
              propKey = findPropKey(
                node as ComponentNode | ComponentSetNode,
                propName
              );
            }
          }

          // Step 2: Add text node to _Code Only Props frame on each variant
          // and wire up the component property reference.
          const targets = getComponentTargets(
            node as ComponentNode | ComponentSetNode | FrameNode | InstanceNode
          );
          for (const target of targets) {
            const frame = await getOrCreateCodeOnlyPropsFrame(target);

            // Text content depends on how the prop is surfaced:
            // TEXT: empty — the binding makes the layer reflect the property value
            // BOOLEAN: prop name — visibility binding makes the layer show/hide
            // none: "propName: signature" for documentation
            const textContent =
              figmaPropType === "TEXT"
                ? String(defaultValue ?? "")
                : figmaPropType === "BOOLEAN"
                ? propName
                : `${propName}: ${String(defaultValue ?? propCategory ?? "")}`;

            const textNode = await addPropTextNode(frame, propName, textContent);

            // Step 3: Bind the text node to the component property
            if (propKey) {
              if (figmaPropType === "TEXT") {
                textNode.componentPropertyReferences = { characters: propKey };
              } else if (figmaPropType === "BOOLEAN") {
                textNode.componentPropertyReferences = { visible: propKey };
              }
            }
          }
        }
      }
    }
  }

  // --- Selection Change Listener ---
  // Always resets UI on selection change so stale results are never shown.
  figma.on("selectionchange", () => {
    const selection = figma.currentPage.selection;
    const hasValid =
      selection.length > 0 &&
      ["COMPONENT", "COMPONENT_SET", "INSTANCE", "FRAME"].includes(
        selection[0].type
      );

    if (hasValid) {
      // A new valid component was selected — prompt the user to audit it
      figma.ui.postMessage({ type: "SELECTION_CHANGED" });
    } else {
      // Nothing (or an unsupported layer) selected — return to idle
      figma.ui.postMessage({ type: "SELECTION_CLEARED" });
    }
  });

  // --- Message Handler ---
  figma.ui.onmessage = async (msg: UIToMain) => {
    switch (msg.type) {
      case "GET_COMPONENT_DATA": {
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
          figma.ui.postMessage({ type: "NO_SELECTION" });
          return;
        }

        const node = selection[0];
        if (!["COMPONENT", "COMPONENT_SET", "INSTANCE", "FRAME"].includes(node.type)) {
          figma.ui.postMessage({ type: "NO_SELECTION" });
          return;
        }

        const data = extractComponentData(node);
        figma.ui.postMessage({ type: "COMPONENT_DATA", payload: data });
        break;
      }

      case "SCAFFOLD": {
        try {
          await scaffoldMissingProps(msg.payload.findings);
          figma.ui.postMessage({ type: "SCAFFOLD_DONE" });
        } catch (error) {
          figma.ui.postMessage({
            type: "SCAFFOLD_ERROR",
            payload: {
              message:
                error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
        break;
      }

      case "RESIZE": {
        figma.ui.resize(msg.payload.width, msg.payload.height);
        break;
      }
    }
  };
}
