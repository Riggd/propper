import { useState, useEffect, useCallback } from "react";
import type { PluginState, AuditResult, ExtractedComponentData, MainToUI } from "../types";
import { ThemeContext } from "../theme";
import { IdleState } from "./IdleState";
import { AuditingState } from "./AuditingState";
import { ResultState } from "./ResultState";
import { EmptyState } from "./EmptyState";

const PROXY_URL = "http://localhost:3333";

function getInitialTheme(): boolean {
  try {
    const saved = localStorage.getItem("propper-theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
  } catch {
    // localStorage unavailable in some sandboxed contexts
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function App() {
  const [state, setState] = useState<PluginState>("idle");
  const [componentData, setComponentData] = useState<ExtractedComponentData | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scaffolding, setScaffolding] = useState(false);
  const [scaffoldDone, setScaffoldDone] = useState(false);
  const [isDark, setIsDark] = useState(getInitialTheme);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("propper-theme", next ? "dark" : "light");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Sync dark class to <html> so body/viewport background responds
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Listen for messages from the plugin main thread
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data.pluginMessage as MainToUI;
      if (!msg) return;

      switch (msg.type) {
        case "COMPONENT_DATA":
          setComponentData(msg.payload);
          runAudit(msg.payload);
          break;
        case "NO_SELECTION":
          setState("empty");
          break;
        case "SELECTION_CHANGED":
          // Different component selected — reset so they audit the new one
          setState("idle");
          setComponentData(null);
          setAuditResult(null);
          setError(null);
          setScaffoldDone(false);
          break;
        case "SELECTION_CLEARED":
          // Nothing selected — return to idle
          setState("idle");
          setComponentData(null);
          setAuditResult(null);
          setError(null);
          setScaffoldDone(false);
          break;
        case "SCAFFOLD_DONE":
          setScaffolding(false);
          setScaffoldDone(true);
          break;
        case "SCAFFOLD_ERROR":
          setScaffolding(false);
          setError(msg.payload.message);
          break;
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const runAudit = useCallback(async (data: ExtractedComponentData) => {
    setState("auditing");
    setError(null);
    setScaffoldDone(false);

    try {
      const response = await fetch(`${PROXY_URL}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentData: data, context: {} }),
      });

      if (!response.ok) {
        throw new Error(`Proxy returned ${response.status}`);
      }

      const result: AuditResult = await response.json();
      setAuditResult(result);
      setState("result");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to Propper proxy. Make sure it's running on port 3333."
      );
      setState("result");
    }
  }, []);

  const handleAudit = useCallback(() => {
    setState("auditing");
    parent.postMessage({ pluginMessage: { type: "GET_COMPONENT_DATA" } }, "*");
  }, []);

  const handleScaffold = useCallback((findings: import("../types").AuditFinding[]) => {
    if (findings.length === 0) return;

    setScaffolding(true);
    parent.postMessage(
      {
        pluginMessage: {
          type: "SCAFFOLD",
          payload: { findings },
        },
      },
      "*"
    );
  }, []);

  // Always re-extract from Figma so the score reflects the current component state
  const handleReaudit = useCallback(() => {
    handleAudit();
  }, [handleAudit]);

  const stateView = (() => {
    switch (state) {
      case "idle":
        return <IdleState onAudit={handleAudit} />;
      case "auditing":
        return <AuditingState />;
      case "result":
        return (
          <ResultState
            componentData={componentData}
            result={auditResult}
            error={error}
            scaffolding={scaffolding}
            scaffoldDone={scaffoldDone}
            onScaffold={handleScaffold}
            onReaudit={handleReaudit}
            onBack={() => setState("idle")}
          />
        );
      case "empty":
        return <EmptyState onRetry={handleAudit} />;
    }
  })();

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div
        className={`${isDark ? "dark" : ""} h-screen overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        {stateView}
      </div>
    </ThemeContext.Provider>
  );
}
