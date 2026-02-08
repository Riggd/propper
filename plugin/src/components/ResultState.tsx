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

function FindingCard({
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
  const fixable = !!finding.autoFixData;
  const borderColor =
    finding.type === "error" ? "#dc2626" : finding.type === "warning" ? "#d97706" : "#2563eb";

  return (
    <div
      className="finding-card animate-slide-up"
      style={{ borderLeftColor: borderColor, animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-3">
        {fixable && (
          <input
            type="checkbox"
            className="mt-0.5 shrink-0 accent-propper-600 w-4 h-4"
            checked={selected}
            onChange={() => onToggle(index)}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xs text-propper-700">
            {finding.autoFixData?.propName ?? finding.check}
          </p>
          <p className="text-[11px] text-propper-400 mt-0.5 leading-relaxed">{finding.message}</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  count,
  color,
}: {
  icon: string;
  title: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span>{icon}</span>
      <h3 className="font-bold text-sm" style={{ color }}>
        {title} ({count})
      </h3>
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

  // Pre-select all error-level fixable findings
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

  // Group findings
  const errors = (result?.findings ?? [])
    .map((f, i) => ({ finding: f, idx: i }))
    .filter(({ finding }) => finding.type === "error");
  const warnings = (result?.findings ?? [])
    .map((f, i) => ({ finding: f, idx: i }))
    .filter(({ finding }) => finding.type === "warning");

  const fixableCount = result?.findings.filter((f) => f.autoFixData).length ?? 0;
  const selectedFindings = result?.findings.filter((_, i) => selectedIndices.has(i)) ?? [];
  const selectedCount = selectedFindings.length;

  // Calculate passing checks from checks data
  const passingChecks: string[] = [];
  if (result) {
    if (result.checks.props.pass) passingChecks.push("Component Structure");
    if (result.checks.tokens.pass) passingChecks.push("Design Tokens");
    if (result.checks.a11y.pass) passingChecks.push("Accessibility");
    if (result.checks.props.passed > 0 && !result.checks.props.pass) passingChecks.push("Naming Convention");
  }

  return (
    <div className="flex flex-col h-screen animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-propper-200">
        <button
          onClick={onBack}
          className="text-propper-600 hover:text-propper-700 text-xs font-bold border border-propper-200 px-2.5 py-1 hover:border-propper-400 transition-colors"
        >
          ← Back
        </button>
        <span className="font-display text-lg text-propper-700">Assessment</span>
        <div className="w-14" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {error && (
          <div className="text-xs text-red-700 bg-red-50 border-2 border-red-200 p-3 font-bold">
            Connection error: {error}
          </div>
        )}

        {result && (
          <>
            {/* Critical issues */}
            {errors.length > 0 && (
              <div className="space-y-2">
                <SectionHeader icon="🚫" title="Critical Issues" count={errors.length} color="#dc2626" />
                {errors.map(({ finding, idx }) => (
                  <FindingCard
                    key={idx}
                    finding={finding}
                    index={idx}
                    selected={selectedIndices.has(idx)}
                    onToggle={toggleFinding}
                  />
                ))}
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-2">
                <SectionHeader icon="⚠️" title="Warnings" count={warnings.length} color="#d97706" />
                {warnings.map(({ finding, idx }) => (
                  <FindingCard
                    key={idx}
                    finding={finding}
                    index={idx}
                    selected={selectedIndices.has(idx)}
                    onToggle={toggleFinding}
                  />
                ))}
              </div>
            )}

            {/* Passing checks */}
            {passingChecks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 pt-2">
                  <span>✅</span>
                  <h3 className="font-bold text-sm text-green-700">Passing Checks</h3>
                </div>
                <ul className="pl-6 space-y-1.5">
                  {passingChecks.map((check) => (
                    <li key={check} className="text-xs text-propper-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      {check}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* All clear */}
            {result.findings.length === 0 && (
              <div className="text-center py-8 space-y-3 animate-slide-up">
                <span className="text-4xl">🎉</span>
                <p className="font-bold text-sm text-green-700">All checks passed!</p>
                <p className="text-xs text-propper-400">This component is ready for handoff.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-2 space-y-2">
        {result && fixableCount > 0 && !scaffoldDone && (
          <button
            onClick={() => onScaffold(selectedFindings)}
            disabled={scaffolding || selectedCount === 0}
            className="btn-primary w-full h-11 text-xs"
          >
            {scaffolding
              ? "Fixing..."
              : selectedCount === 0
              ? "Select issues to fix"
              : `Fix ${selectedCount} issue${selectedCount !== 1 ? "s" : ""}`}
          </button>
        )}
        {scaffoldDone && (
          <div className="text-center py-2 text-xs font-bold text-green-700 animate-fade-in">
            ✓ Fixed! Re-scan to verify.
          </div>
        )}
        <button
          onClick={onReaudit}
          className="btn-primary w-full h-12 text-sm"
        >
          Re-scan
        </button>
      </div>
    </div>
  );
}
