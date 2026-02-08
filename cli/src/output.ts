import chalk from "chalk";

interface AuditResult {
  score: number;
  componentType: string;
  checks: {
    props: { pass: boolean; total: number; passed: number };
    a11y: { pass: boolean; total: number; passed: number };
    tokens: { pass: boolean; total: number; passed: number };
  };
  findings: Array<{
    type: "error" | "warning" | "info";
    check: string;
    message: string;
  }>;
}

function scoreColor(score: number) {
  if (score >= 80) return chalk.green;
  if (score >= 50) return chalk.yellow;
  return chalk.red;
}

function levelIcon(level: string) {
  switch (level) {
    case "error":
      return chalk.red("✗ [ERR] ");
    case "warning":
      return chalk.yellow("⚠ [WARN]");
    case "info":
      return chalk.blue("ℹ [INFO]");
    default:
      return "  ";
  }
}

export function printTerminal(
  componentName: string,
  result: AuditResult
): void {
  const pass = result.score >= 80 && !result.findings.some((f) => f.type === "error");
  const statusLine = pass
    ? chalk.green.bold("✓ PASS")
    : chalk.red.bold("✗ FAIL");

  console.log("\n" + chalk.bold("Propper Audit") + " — " + chalk.cyan(componentName));
  console.log("─".repeat(50));
  console.log(
    `  Score:      ${scoreColor(result.score).bold(result.score + "%")} (${result.componentType})`
  );
  console.log(`  Status:     ${statusLine}`);
  console.log();
  console.log("  Checks:");
  console.log(
    `    Props       ${result.checks.props.pass ? chalk.green("PASS") : chalk.red("FAIL")}  ${result.checks.props.passed}/${result.checks.props.total}`
  );
  console.log(
    `    A11y        ${result.checks.a11y.pass ? chalk.green("PASS") : chalk.red("FAIL")}  ${result.checks.a11y.passed}/${result.checks.a11y.total}`
  );
  console.log(
    `    Tokens      ${result.checks.tokens.pass ? chalk.green("PASS") : chalk.gray("N/A ")}  ${result.checks.tokens.passed}/${result.checks.tokens.total}`
  );

  if (result.findings.length > 0) {
    console.log();
    console.log("  Findings:");
    for (const finding of result.findings) {
      console.log(`    ${levelIcon(finding.type)} ${finding.message}`);
    }
  } else {
    console.log();
    console.log(chalk.green("  ✓ All checks passed — ready for handoff!"));
  }

  console.log("─".repeat(50) + "\n");
}

export function printJson(componentName: string, result: AuditResult): void {
  console.log(
    JSON.stringify({ component: componentName, ...result }, null, 2)
  );
}

export function printMarkdown(
  componentName: string,
  result: AuditResult
): void {
  const pass = result.score >= 80 && !result.findings.some((f) => f.type === "error");
  const lines = [
    `## Propper Audit: \`${componentName}\``,
    "",
    `| Check | Status | Score |`,
    `|-------|--------|-------|`,
    `| **Props** | ${result.checks.props.pass ? "✅ Pass" : "❌ Fail"} | ${result.checks.props.passed}/${result.checks.props.total} |`,
    `| **A11y** | ${result.checks.a11y.pass ? "✅ Pass" : "❌ Fail"} | ${result.checks.a11y.passed}/${result.checks.a11y.total} |`,
    `| **Tokens** | ${result.checks.tokens.pass ? "✅ Pass" : "➖ N/A"} | — |`,
    "",
    `**Overall Score:** ${result.score}% — ${pass ? "✅ PASS" : "❌ FAIL"}`,
    "",
  ];

  if (result.findings.length > 0) {
    lines.push("### Findings", "");
    for (const f of result.findings) {
      const icon = f.type === "error" ? "🔴" : f.type === "warning" ? "🟡" : "🔵";
      lines.push(`- ${icon} **[${f.type.toUpperCase()}]** ${f.message}`);
    }
  }

  console.log(lines.join("\n"));
}
