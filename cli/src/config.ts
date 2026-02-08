/**
 * Token resolution with fallback chain:
 *   1. FIGMA_TOKEN environment variable
 *   2. .env file in the current working directory
 *   3. ~/.propper config file
 */

import { readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { createInterface } from "readline";
import { config as loadDotenv } from "dotenv";

const CONFIG_PATH = join(homedir(), ".propper");

interface PropperConfig {
  figmaToken?: string;
}

function readConfig(): PropperConfig {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    return {};
  }
}

/**
 * Resolves the Figma token using the fallback chain.
 * Returns the token string, or null if not found anywhere.
 */
export function resolveToken(): string | null {
  // 1. Explicit env var (e.g. set in shell or CI)
  if (process.env.FIGMA_TOKEN) return process.env.FIGMA_TOKEN;

  // 2. .env file in CWD
  loadDotenv({ path: join(process.cwd(), ".env") });
  if (process.env.FIGMA_TOKEN) return process.env.FIGMA_TOKEN;

  // 3. ~/.propper config file
  const config = readConfig();
  return config.figmaToken ?? null;
}

/**
 * Saves the Figma token to ~/.propper.
 */
export function saveToken(token: string): void {
  const existing = readConfig();
  writeFileSync(CONFIG_PATH, JSON.stringify({ ...existing, figmaToken: token }, null, 2));
}

/**
 * Prompts for the token interactively with hidden input (no echo).
 * The token never appears in shell history.
 */
export function promptToken(): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write("Figma personal access token: ");

    let token = "";

    const onData = (data: Buffer) => {
      const char = data.toString();
      if (char === "\r" || char === "\n") {
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        process.stdin.removeListener("data", onData);
        process.stdout.write("\n");
        rl.close();
        resolve(token);
      } else if (char === "\u0003") {
        // Ctrl+C
        process.stdout.write("\n");
        process.exit(1);
      } else if (char === "\u007f" || char === "\b") {
        // Backspace
        if (token.length > 0) token = token.slice(0, -1);
      } else {
        token += char;
      }
    };

    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}

export { CONFIG_PATH };
