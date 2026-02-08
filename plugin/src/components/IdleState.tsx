import type { TargetFramework, ExtractedComponentData } from "../types";
import { FRAMEWORK_OPTIONS } from "../types";

interface IdleStateProps {
  onAudit: () => void;
  framework: TargetFramework;
  onFrameworkChange: (fw: TargetFramework) => void;
  componentData: ExtractedComponentData | null;
}

function FrameworkIcon({ icon }: { icon: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-white border border-propper-200 shadow-soft flex items-center justify-center shrink-0">
      <span className="text-sm">{icon}</span>
    </div>
  );
}

export function IdleState({ onAudit, framework, onFrameworkChange, componentData }: IdleStateProps) {
  const hasSelection = !!componentData;

  return (
    <div className="flex flex-col h-screen animate-fade-in">
      {/* Content area */}
      <div className="flex-1 flex flex-col px-4 pt-4 pb-4 gap-6 overflow-y-auto">
        {/* Header */}
        <h1 className="font-display text-4xl text-propper-700 text-center leading-tight">
          Propper Design &amp; Dev
        </h1>

        {/* Component preview zone */}
        <div
          className={`drop-zone h-44 flex-col gap-2 rounded-none ${
            hasSelection ? "drop-zone--active" : ""
          }`}
        >
          {hasSelection ? (
            <div className="flex flex-col items-center gap-2 animate-fade-in">
              <div className="bg-white border-2 border-black shadow-brutal-sm px-4 py-2">
                <span className="font-bold text-xs text-propper-700 uppercase tracking-wide">
                  {componentData.name}
                </span>
              </div>
              <span className="text-[10px] text-propper-400 uppercase tracking-wider">
                {componentData.type}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-propper-400 uppercase tracking-widest font-bold">
              Select a component or frame to modernise
            </span>
          )}
        </div>

        {/* Framework selection */}
        <div className="flex flex-col gap-2">
          <label className={`font-bold text-xs text-propper-700 ${!hasSelection ? "opacity-20" : ""}`}>
            Target Framework
          </label>
          <div className={`flex flex-col gap-2 ${!hasSelection ? "opacity-20 pointer-events-none" : ""}`}>
            {FRAMEWORK_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={framework === opt.id}
                className="framework-card"
                onClick={() => onFrameworkChange(opt.id)}
                disabled={!hasSelection}
              >
                <FrameworkIcon icon={opt.icon} />
                <div className="flex flex-col items-start">
                  <span className="font-bold text-[11px] text-propper-700">{opt.name}</span>
                  <span className="font-bold text-[10px] text-propper-400">{opt.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky CTA button */}
      <div className="px-4 pb-4 pt-2">
        <button
          onClick={onAudit}
          disabled={!hasSelection}
          className="btn-primary w-full h-12 text-sm"
        >
          Make this Propper
        </button>
      </div>
    </div>
  );
}
