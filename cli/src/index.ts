#!/usr/bin/env node
import { program } from "commander";
import fetch from "node-fetch";
import { parseFigmaUrl, fetchFigmaNode, transformNodeToComponentData } from "./figma.js";
import { printTerminal, printJson, printMarkdown } from "./output.js";
import { resolveToken, saveToken, promptToken, CONFIG_PATH } from "./config.js";

const PROXY_URL = process.env.PROPPER_PROXY_URL ?? "http://localhost:3333";

program
  .name("propper")
  .description("Audit Figma components for code-readiness")
  .version("1.0.0");

program
  .command("audit <figma-url>")
  .description("Audit a Figma component against the Propper rules engine")
  .option("--json", "Output as JSON")
  .option("--markdown", "Output as Markdown for PR comments")
  .option("--proxy <url>", "Proxy URL (default: http://localhost:3333)")
  .action(async (figmaUrl: string, options: { json?: boolean; markdown?: boolean; proxy?: string }) => {
    const proxyUrl = options.proxy ?? PROXY_URL;
    const token = resolveToken();

    if (!token) {
      console.error(
        "Error: Figma token not found.\n" +
        "Set it with one of:\n" +
        "  propper config set-token <token>\n" +
        "  export FIGMA_TOKEN=your_token\n" +
        "  echo 'FIGMA_TOKEN=your_token' >> .env"
      );
      process.exit(1);
    }

    try {
      // 1. Parse URL
      const { fileKey, nodeId } = parseFigmaUrl(figmaUrl);
      if (!nodeId) {
        console.error(
          "Error: URL must include a node-id parameter.\n" +
          "Right-click a component in Figma → Copy link to selection"
        );
        process.exit(1);
      }

      if (!options.json && !options.markdown) {
        console.log(`Fetching component from Figma...`);
      }

      // 2. Fetch from Figma API
      const node = await fetchFigmaNode(fileKey, nodeId, token);
      const componentData = transformNodeToComponentData(node);

      if (!options.json && !options.markdown) {
        console.log(`Auditing "${node.name}"...`);
      }

      // 3. Run audit via proxy
      const response = await fetch(`${proxyUrl}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentData, context: {} }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Proxy error ${response.status}: ${body}`);
      }

      const result = await response.json() as Parameters<typeof printTerminal>[1];

      // 4. Output results
      if (options.json) {
        printJson(node.name, result);
      } else if (options.markdown) {
        printMarkdown(node.name, result);
      } else {
        printTerminal(node.name, result);
      }

      // Exit with non-zero code if audit fails (for CI/CD)
      const hasErrors = result.findings.some((f: { type: string }) => f.type === "error");
      process.exit(hasErrors ? 1 : 0);
    } catch (error) {
      console.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  });

program
  .command("config")
  .description("Manage Propper configuration")
  .command("set-token")
  .description(`Securely save your Figma personal access token to ${CONFIG_PATH}`)
  .action(async () => {
    const token = await promptToken();
    if (!token) {
      console.error("No token entered.");
      process.exit(1);
    }
    saveToken(token);
    console.log(`Token saved to ${CONFIG_PATH}`);
  });

program.parse();
