import { useState, useEffect, useCallback } from "react";
import type { PluginState, AuditResult, ExtractedComponentData, MainToUI } from "../types";
import { IdleState } from "./IdleState";
import { AuditingState } from "./AuditingState";
import { ResultState } from "./ResultState";
import { EmptyState } from "./EmptyState";

const PROXY_URL = "http://localhost:3333";

export function App() {
  const [state, setState] = useState<PluginState>("idle");
  const [componentData, setComponentData] = useState<ExtractedComponentData | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scaffolding, setScaffolding] = useState(false);
  const [scaffoldDone, setScaffoldDone] = useState(false);

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

  const handleScaffold = useCallback(() => {
    if (!auditResult) return;
    const fixableFindings = auditResult.findings.filter((f) => f.autoFixData);
    if (fixableFindings.length === 0) return;

    setScaffolding(true);
    parent.postMessage(
      {
        pluginMessage: {
          type: "SCAFFOLD",
          payload: { findings: fixableFindings },
        },
      },
      "*"
    );
  }, [auditResult]);

  const handleReaudit = useCallback(() => {
    if (!componentData) {
      handleAudit();
    } else {
      runAudit(componentData);
    }
  }, [componentData, handleAudit, runAudit]);

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
}
