import type { AuditResult, ExtractedComponentData, TargetFramework } from "../types";
import { FRAMEWORK_OPTIONS } from "../types";

interface SummaryStateProps {
  componentData: ExtractedComponentData | null;
  result: AuditResult;
  framework: TargetFramework;
  onViewDetails: () => void;
  onBack: () => void;
}

function ScoreRing({ passed, total }: { passed: number; total: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? passed / total : 0;
  const offset = circumference - ratio * circumference;

  // Color segments
  const getColor = () => {
    if (ratio >= 0.8) return { ring: "#16a34a", text: "#16a34a", label: "LOOKING SHARP" };
    if (ratio >= 0.5) return { ring: "#d97706", text: "#d97706", label: "REQUIRES ATTENTION" };
    return { ring: "#dc2626", text: "#dc2626", label: "NEEDS WORK" };
  };

  const { ring, text, label } = getColor();

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="score-ring-fill"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-3xl" style={{ color: text }}>
            {passed}/{total}
          </span>
        </div>
      </div>
      <span
        className="text-[10px] font-bold uppercase tracking-widest"
        style={{ color: text }}
      >
        {label}
      </span>
    </div>
  );
}

function CategoryRow({
  icon,
  label,
  badge,
  badgeColor,
}: {
  icon: string;
  label: string;
  badge: string;
  badgeColor: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-2 border-propper-200 bg-white shadow-soft">
      <div className="flex items-center gap-3">
        <span className="text-base">{icon}</span>
        <span className="font-bold text-xs text-propper-700">{label}</span>
      </div>
      <span
        className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
        style={{
          color: badgeColor,
          backgroundColor: `${badgeColor}15`,
          border: `1px solid ${badgeColor}40`,
        }}
      >
        {badge}
      </span>
    </div>
  );
}

export function SummaryState({
  componentData,
  result,
  framework,
  onViewDetails,
  onBack,
}: SummaryStateProps) {
  const frameworkLabel = FRAMEWORK_OPTIONS.find((f) => f.id === framework)?.name ?? "React + shadcn";
  const totalChecks = result.checks.props.total + result.checks.a11y.total + (result.checks.tokens.total || 1);
  const totalPassed = result.checks.props.passed + result.checks.a11y.passed + result.checks.tokens.passed;

  // Category summaries
  const propsMissing = result.checks.props.total - result.checks.props.passed;
  const tokensMissing = (result.checks.tokens.total || 1) - result.checks.tokens.passed;
  const a11yMissing = result.checks.a11y.total - result.checks.a11y.passed;

  return (
    <div className="flex flex-col h-screen animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-propper-200">
        <button onClick={onBack} className="text-propper-400 hover:text-propper-700 text-xs font-bold uppercase tracking-wider">
          ← Back
        </button>
        <span className="font-display text-lg text-propper-700">Summary</span>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Component name + framework badge */}
        <div className="flex items-center gap-2 justify-center flex-wrap">
          <span className="font-bold text-sm text-propper-700">
            {componentData?.name ?? "Component"}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 border border-propper-200 text-propper-400 uppercase tracking-wider">
            {frameworkLabel}
          </span>
        </div>

        {/* Score ring */}
        <ScoreRing passed={totalPassed} total={totalChecks} />

        {/* Category rows */}
        <div className="space-y-2">
          <CategoryRow
            icon="⚠️"
            label="Props & States"
            badge={propsMissing > 0 ? `${propsMissing} Missing` : "All Good"}
            badgeColor={propsMissing > 0 ? "#d97706" : "#16a34a"}
          />
          <CategoryRow
            icon="⚠️"
            label="Tokens"
            badge={tokensMissing > 0 ? `${tokensMissing} Mismatch${tokensMissing > 1 ? "es" : ""}` : "All Good"}
            badgeColor={tokensMissing > 0 ? "#d97706" : "#16a34a"}
          />
          <CategoryRow
            icon="🚫"
            label="Accessibility"
            badge={a11yMissing > 0 ? `${a11yMissing} Critical` : "All Good"}
            badgeColor={a11yMissing > 0 ? "#dc2626" : "#16a34a"}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4 pt-2">
        <button
          onClick={onViewDetails}
          className="btn-secondary w-full h-12 text-sm flex items-center justify-center gap-2"
        >
          View Recommendations
          <span className="text-base">→</span>
        </button>
      </div>
    </div>
  );
}
