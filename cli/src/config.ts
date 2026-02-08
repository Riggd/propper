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
 * The token never appears in shell history or on screen.
 */
export function promptToken(): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });

    // Write the prompt manually, then suppress all further output so
    // neither typed characters nor pasted text is echoed back.
    process.stdout.write("Figma personal access token: ");
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = () => {};

    rl.question("", (token) => {
      process.stdout.write("\n");
      rl.close();
      resolve(token.trim());
    });
  });
}

export { CONFIG_PATH };
