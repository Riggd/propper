const CHECKS = ["Props", "Tokens", "Accessibility"];

export function AuditingState() {
  return (
    <div className="flex flex-col items-center justify-center h-screen px-6 text-center gap-6">
      {/* Spinner */}
      <div className="w-10 h-10 rounded-full border-4 border-sky-100 border-t-sky-600 animate-spin" />

      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-gray-800">Analyzing Component...</h2>
        <p className="text-xs text-gray-500">Running 3-point audit</p>
      </div>

      {/* Progress indicators */}
      <div className="w-full max-w-[200px] space-y-2">
        {CHECKS.map((check, i) => (
          <div key={check} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  i === 0 ? "#0ea5e9" : i === 1 ? "#e2e8f0" : "#e2e8f0",
                animation: i === 0 ? "pulse 1.5s ease-in-out infinite" : undefined,
              }}
            />
            <span className={`text-xs ${i === 0 ? "text-gray-700" : "text-gray-400"}`}>
              {check}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
