import { ThemeToggle } from "./ThemeToggle";

interface IdleStateProps {
  onAudit: () => void;
}

export function IdleState({ onAudit }: IdleStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-6 text-center gap-5">
      <div className="absolute top-2 right-2">
        <ThemeToggle />
      </div>

      {/* Logo */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center shadow-md">
        <span className="text-white text-xl font-bold">P</span>
      </div>

      <div className="space-y-1">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">Propper</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[220px]">
          Select a component layer in Figma and click Audit to check it for code-readiness.
        </p>
      </div>

      <button
        onClick={onAudit}
        className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
      >
        Audit Component
      </button>

      <p className="text-[10px] text-gray-400 dark:text-gray-500">
        Make sure the Propper proxy is running on{" "}
        <code className="font-mono">:3333</code>
      </p>
    </div>
  );
}
