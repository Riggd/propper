import { useState, useEffect } from "react";
import type { AuditResult, AuditFinding, ExtractedComponentData } from "../types";

interface ResultStateProps {
  componentData: ExtractedComponentData | null;
  result: AuditResult | null;
  error: string | null;
  scaffolding: boolean;
  scaffoldDone: boolean;
  onScaffold: (findings: AuditFinding[]) => void;
  onReaudit: () => void;
  onBack: () => void;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";
  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center border-4 font-bold text-lg"
      style={{ borderColor: color, color }}
    >
      {score}
    </div>
  );
}

function CheckRow({
  label,
  passed,
  total,
}: {
  label: string;
  passed: number;
  total: number;
}) {
  const ok = passed === total;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <span
          className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold text-white"
          style={{ backgroundColor: ok ? "#16a34a" : "#dc2626" }}
        >
          {ok ? "✓" : "✗"}
        </span>
        <span className="text-xs text-gray-700">{label}</span>
      </div>
      <span className="text-xs text-gray-500">
        {passed}/{total}
      </span>
    </div>
  );
}

const SEVERITY_CONFIG = {
  error: {
    label: "Errors",
    colors: "bg-red-50 border-red-200 text-red-700",
    badge: "ERR",
    headerColor: "text-red-700",
  },
  warning: {
    label: "Warnings",
    colors: "bg-amber-50 border-amber-200 text-amber-700",
    badge: "WARN",
    headerColor: "text-amber-700",
  },
  info: {
    label: "Info",
    colors: "bg-blue-50 border-blue-200 text-blue-700",
    badge: "INFO",
    headerColor: "text-blue-700",
  },
} as const;

function FindingItem({
  finding,
  index,
  selected,
  onToggle,
}: {
  finding: AuditFinding;
  index: number;
  selected: boolean;
  onToggle: (i: number) => void;
}) {
  const { colors, badge } = SEVERITY_CONFIG[finding.type];
  const fixable = !!finding.autoFixData;

  return (
    <label
      className={`flex items-start gap-2 text-[11px] px-2 py-1.5 rounded border ${colors} ${fixable ? "cursor-pointer" : ""}`}
    >
      {fixable ? (
        <input
          type="checkbox"
          className="mt-0.5 shrink-0 accent-current"
          checked={selected}
          onChange={() => onToggle(index)}
        />
      ) : (
        <span className="w-3.5 shrink-0" />
      )}
      <span>
        <span className="font-semibold mr-1">[{badge}]</span>
        {finding.message}
      </span>
    </label>
  );
}

function FindingGroup({
  type,
  findings,
  selectedIndices,
  onToggle,
}: {
  type: keyof typeof SEVERITY_CONFIG;
  findings: Array<{ finding: AuditFinding; originalIndex: number }>;
  selectedIndices: Set<number>;
  onToggle: (i: number) => void;
}) {
  if (findings.length === 0) return null;
  const { label, headerColor } = SEVERITY_CONFIG[type];

  return (
    <div className="space-y-1">
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${headerColor}`}>
        {label} ({findings.length})
      </p>
      {findings.map(({ finding, originalIndex }) => (
        <FindingItem
          key={originalIndex}
          finding={finding}
          index={originalIndex}
          selected={selectedIndices.has(originalIndex)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

export function ResultState({
  componentData,
  result,
  error,
  scaffolding,
  scaffoldDone,
  onScaffold,
  onReaudit,
  onBack,
}: ResultStateProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Reset selection when result changes — pre-select all error-level fixable findings
  useEffect(() => {
    if (!result) return;
    const initial = new Set(
      result.findings
        .map((f, i) => ({ f, i }))
        .filter(({ f }) => f.type === "error" && !!f.autoFixData)
        .map(({ i }) => i)
    );
    setSelectedIndices(initial);
  }, [result]);

  const toggleFinding = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Group findings by severity
  const groups = (["error", "warning", "info"] as const).map((type) => ({
    type,
    findings: (result?.findings ?? [])
      .map((f, i) => ({ finding: f, originalIndex: i }))
      .filter(({ finding }) => finding.type === type),
  }));

  const fixableCount = result?.findings.filter((f) => f.autoFixData).length ?? 0;
  const selectedFindings = result?.findings.filter((_, i) => selectedIndices.has(i)) ?? [];
  const selectedCount = selectedFindings.length;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-xs">
          ← Back
        </button>
        <span className="text-xs font-medium text-gray-700 truncate max-w-[180px]">
          {componentData?.name ?? "Component"}
        </span>
        <button onClick={onReaudit} className="text-sky-600 hover:text-sky-700 text-xs">
          Re-run
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            <strong>Connection error:</strong> {error}
          </div>
        )}

        {result && (
          <>
            {/* Score */}
            <div className="flex items-center gap-4">
              <ScoreRing score={result.score} />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {result.score >= 80
                    ? "Looking sharp!"
                    : result.score >= 50
                    ? "Needs attention"
                    : "Needs work"}
                </p>
                <p className="text-[11px] text-gray-500">{result.componentType}</p>
              </div>
            </div>

            {/* Check scores */}
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <CheckRow
                label="Props"
                passed={result.checks.props.passed}
                total={result.checks.props.total}
              />
              <CheckRow
                label="Accessibility"
                passed={result.checks.a11y.passed}
                total={result.checks.a11y.total}
              />
              <CheckRow
                label="Tokens"
                passed={result.checks.tokens.passed}
                total={result.checks.tokens.total || 1}
              />
            </div>

            {/* Findings grouped by severity */}
            {result.findings.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700">
                  Issues ({result.findings.length})
                  {fixableCount > 0 && (
                    <span className="ml-1 font-normal text-gray-400">
                      — select which to fix
                    </span>
                  )}
                </p>
                {groups.map(({ type, findings }) => (
                  <FindingGroup
                    key={type}
                    type={type}
                    findings={findings}
                    selectedIndices={selectedIndices}
                    onToggle={toggleFinding}
                  />
                ))}
              </div>
            )}

            {result.findings.length === 0 && (
              <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                ✓ All checks passed — ready for handoff!
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer: Make it Propper CTA */}
      {result && fixableCount > 0 && (
        <div className="px-4 py-3 border-t border-gray-100">
          {scaffoldDone ? (
            <div className="text-xs text-green-700 text-center py-1">
              ✓ Scaffolded {selectedCount} prop{selectedCount !== 1 ? "s" : ""}! Re-run audit to verify.
            </div>
          ) : (
            <button
              onClick={() => onScaffold(selectedFindings)}
              disabled={scaffolding || selectedCount === 0}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {scaffolding
                ? "straightening your tie..."
                : selectedCount === 0
                ? "Select props to fix"
                : `Make it Propper — fix ${selectedCount} prop${selectedCount !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
