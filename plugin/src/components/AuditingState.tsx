import { useState, useEffect } from "react";
import type { TargetFramework } from "../types";
import { FRAMEWORK_OPTIONS } from "../types";

interface AuditingStateProps {
  componentName?: string;
  framework: TargetFramework;
}

const CHECKS = ["Props & States", "Design Tokens", "Accessibility"];

export function AuditingState({ componentName, framework }: AuditingStateProps) {
  const [activeCheck, setActiveCheck] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCheck((prev) => (prev + 1) % CHECKS.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const frameworkLabel = FRAMEWORK_OPTIONS.find((f) => f.id === framework)?.name ?? "React + shadcn/ui";

  return (
    <div className="flex flex-col items-center justify-center h-screen px-8 text-center gap-8 animate-fade-in">
      {/* Spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-propper-200" />
        <div className="absolute inset-0 rounded-full border-4 border-t-propper-600 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-t-propper-500 animate-spin-slow" style={{ animationDirection: "reverse" }} />
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-2xl text-propper-700">Analyzing...</h2>
        {componentName && (
          <p className="text-xs font-bold text-propper-400 uppercase tracking-wider">
            {componentName}
          </p>
        )}
      </div>

      {/* Progress indicators */}
      <div className="w-full max-w-[240px] space-y-3">
        {CHECKS.map((check, i) => (
          <div key={check} className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i < activeCheck
                  ? "bg-green-500 scale-100"
                  : i === activeCheck
                  ? "bg-propper-600 animate-pulse-dot"
                  : "bg-propper-200"
              }`}
            />
            <span
              className={`text-xs font-bold transition-colors duration-300 ${
                i < activeCheck
                  ? "text-green-600"
                  : i === activeCheck
                  ? "text-propper-700"
                  : "text-propper-300"
              }`}
            >
              {check}
            </span>
            {i < activeCheck && <span className="text-green-500 text-xs ml-auto">✓</span>}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-propper-400 max-w-[260px] leading-relaxed">
        This component is being audited against the{" "}
        <strong className="text-propper-700">{frameworkLabel}</strong> ruleset.
      </p>
    </div>
  );
}
