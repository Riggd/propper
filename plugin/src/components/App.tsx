import { useState, useEffect, useCallback } from "react";
import type { PluginState, AuditResult, ExtractedComponentData, MainToUI, TargetFramework } from "../types";
import { IdleState } from "./IdleState";
import { AuditingState } from "./AuditingState";
import { SummaryState } from "./SummaryState";
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
  const [framework, setFramework] = useState<TargetFramework>("react-shadcn");

  // Listen for messages from the plugin main thread
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data.pluginMessage as MainToUI;
      if (!msg) return;

      switch (msg.type) {
        case "COMPONENT_DATA":
          // Optimistic: show the component in idle state immediately
          setComponentData(msg.payload);
          runAudit(msg.payload);
          // Don't auto-run audit — let user click "Make this Propper"
          setState("idle");
          break;
        case "NO_SELECTION":
          setState("empty");
          break;
        case "SELECTION_CHANGED":
          // Different component selected — reset so they audit the new one
          setState("idle");
          setComponentData(null);
          // Different component selected — stay on idle, request new data
          setAuditResult(null);
          setError(null);
          setScaffoldDone(false);
          // Request the new component's data to show in preview
          parent.postMessage({ pluginMessage: { type: "GET_COMPONENT_DATA" } }, "*");
          break;
        case "SELECTION_CLEARED":
          // Nothing selected — return to idle with no data
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

  // On mount, request component data to check if something is already selected
  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: "GET_COMPONENT_DATA" } }, "*");
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
      setState("summary");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to Propper proxy. Make sure it's running on port 3333."
      );
      setState("assessment");
    }
  }, []);

  const handleAudit = useCallback(() => {
    setState("auditing");
    parent.postMessage({ pluginMessage: { type: "GET_COMPONENT_DATA" } }, "*");
  }, []);

  // const handleAudit = useCallback(() => {
  //   if (componentData) {
  //     runAudit(componentData);
  //   } else {
  //     setState("auditing");
  //     parent.postMessage({ pluginMessage: { type: "GET_COMPONENT_DATA" } }, "*");
  //   }
  // }, [componentData, runAudit]);

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

  const handleReaudit = useCallback(() => {
    if (!componentData) {
      handleAudit();
    } else {
      runAudit(componentData);
    }
  }, [componentData, handleAudit, runAudit]);

  switch (state) {
    case "idle":
      return (
        <IdleState
          onAudit={handleAudit}
          framework={framework}
          onFrameworkChange={setFramework}
          componentData={componentData}
        />
      );
    case "auditing":
      return (
        <AuditingState
          componentName={componentData?.name}
          framework={framework}
        />
      );
    case "summary":
      return auditResult ? (
        <SummaryState
          componentData={componentData}
          result={auditResult}
          framework={framework}
          onViewDetails={() => setState("assessment")}
          onBack={() => setState("idle")}
        />
      ) : null;
    case "assessment":
      return (
        <ResultState
          componentData={componentData}
          result={auditResult}
          error={error}
          scaffolding={scaffolding}
          scaffoldDone={scaffoldDone}
          onScaffold={handleScaffold}
          onReaudit={handleReaudit}
          onBack={() => setState(auditResult ? "summary" : "idle")}
        />
      );
    case "empty":
      return <EmptyState onRetry={handleAudit} />;
  }
}
