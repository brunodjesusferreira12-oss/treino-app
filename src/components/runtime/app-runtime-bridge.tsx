"use client";

import { useEffect } from "react";

import { reportClientError, serializeError } from "@/lib/observability";

export function AppRuntimeBridge() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator &&
      window.location.protocol === "https:"
    ) {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  useEffect(() => {
    function handleError(event: ErrorEvent) {
      reportClientError({
        source: "window.error",
      message: event.message || "Erro de execução no cliente",
        details: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    }

    function handleRejection(event: PromiseRejectionEvent) {
      reportClientError({
        source: "window.unhandledrejection",
        message: "Promise rejeitada sem tratamento",
        details: serializeError(event.reason),
      });
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
