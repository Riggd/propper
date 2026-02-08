/**
 * Figma REST API utilities for the Propper CLI.
 * Requires FIGMA_TOKEN environment variable.
 */

import fetch from "node-fetch";

const FIGMA_API = "https://api.figma.com/v1";

/**
 * Parses a Figma URL to extract the file key and optional node ID.
 * Supports formats:
 *   https://www.figma.com/file/{fileKey}/{title}?node-id={nodeId}
 *   https://www.figma.com/design/{fileKey}/{title}?node-id={nodeId}
 */
export function parseFigmaUrl(url: string): {
  fileKey: string;
  nodeId: string | null;
} {
  const match = url.match(/figma\.com\/(?:file|design)\/([^/\?]+)/);
  if (!match) {
    throw new Error(`Invalid Figma URL: ${url}`);
  }

  const fileKey = match[1];
  const nodeIdMatch = url.match(/node-id=([^&]+)/);
  const nodeId = nodeIdMatch
    ? decodeURIComponent(nodeIdMatch[1]).replace(/-/g, ":")
    : null;

  return { fileKey, nodeId };
}

/**
 * Fetches a single node from the Figma API.
 */
export async function fetchFigmaNode(
  fileKey: string,
  nodeId: string,
  token: string
): Promise<FigmaNode> {
  const response = await fetch(
    `${FIGMA_API}/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`,
    { headers: { "X-Figma-Token": token } }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Figma API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as { nodes: Record<string, { document: FigmaNode }> };
  const node = data.nodes[nodeId]?.document;

  if (!node) {
    throw new Error(`Node ${nodeId} not found in file ${fileKey}`);
  }

  return node;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  componentProperties?: Record<
    string,
    { type: string; value: boolean | string }
  >;
  children?: FigmaNode[];
}

/**
 * Transforms a raw Figma API node into the component data format
 * expected by the Propper proxy audit endpoint.
 */
export function transformNodeToComponentData(node: FigmaNode) {
  // Look for _Code Only Props frame
  const codeOnlyPropsFrame: Array<{ name: string; value: string }> = [];

  if (node.children) {
    const codeFrame = node.children.find(
      (child) =>
        child.name.toLowerCase().startsWith("_code only props") ||
        child.name.toLowerCase().startsWith(".code only props")
    );

    if (codeFrame?.children) {
      for (const child of codeFrame.children) {
        if (child.type === "TEXT" && "characters" in child) {
          const text = (child as unknown as { characters: string }).characters?.trim();
          if (!text) continue;
          const colonIdx = text.indexOf(":");
          if (colonIdx > 0) {
            codeOnlyPropsFrame.push({
              name: text.slice(0, colonIdx).trim(),
              value: text.slice(colonIdx + 1).trim(),
            });
          } else {
            codeOnlyPropsFrame.push({ name: text, value: "" });
          }
        }
      }
    }
  }

  return {
    id: node.id,
    name: node.name,
    type: node.type,
    componentProperties: node.componentProperties,
    codeOnlyPropsFrame,
  };
}
