import { ThemeToggle } from "./ThemeToggle";

interface EmptyStateProps {
  onRetry: () => void;
}

export function EmptyState({ onRetry }: EmptyStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-6 text-center gap-5">
      <div className="absolute top-2 right-2">
        <ThemeToggle />
      </div>

      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <span className="text-2xl">🔲</span>
      </div>

      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">No component selected</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[220px]">
          Select a Component, Instance, or Frame layer in Figma, then try again.
        </p>
      </div>

      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 active:bg-black text-white text-sm font-medium rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
