interface EmptyStateProps {
  onRetry: () => void;
}

export function EmptyState({ onRetry }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen px-8 text-center gap-6 animate-fade-in">
      {/* Empty icon */}
      <div className="w-16 h-16 border-2 border-dashed border-propper-300 flex items-center justify-center">
        <span className="text-2xl text-propper-300">⎔</span>
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-2xl text-propper-700">Nothing Selected</h2>
        <p className="text-xs text-propper-400 leading-relaxed max-w-[240px]">
          Select a Component, Instance, or Frame layer in Figma, then try again.
        </p>
      </div>

      <button
        onClick={onRetry}
        className="btn-secondary h-10 px-8 text-xs"
      >
        Try Again
      </button>
    </div>
  );
}
