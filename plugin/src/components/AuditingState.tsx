import { ThemeToggle } from "./ThemeToggle";

const CHECKS = ["Props", "Tokens", "Accessibility"];

export function AuditingState() {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-6 text-center gap-6">
      <div className="absolute top-2 right-2">
        <ThemeToggle />
      </div>

      {/* Spinner */}
      <div className="w-10 h-10 rounded-full border-4 border-sky-100 dark:border-sky-900 border-t-sky-600 dark:border-t-sky-400 animate-spin" />

      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Analyzing Component...</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">Running 3-point audit</p>
      </div>

      {/* Progress indicators */}
      <div className="w-full max-w-[200px] space-y-2">
        {CHECKS.map((check, i) => (
          <div key={check} className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                i === 0
                  ? "bg-sky-500 animate-pulse"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
            <span className={`text-xs ${i === 0 ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"}`}>
              {check}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
