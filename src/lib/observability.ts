type ReportClientErrorInput = {
  level?: "info" | "warning" | "error";
  source: string;
  route?: string | null;
  message: string;
  details?: Record<string, unknown> | null;
};

export function reportClientError(input: ReportClientErrorInput) {
  if (typeof window === "undefined") {
    return;
  }

  const body = JSON.stringify({
    level: input.level ?? "error",
    source: input.source,
    route: input.route ?? window.location.pathname,
    message: input.message,
    details: input.details ?? null,
    userAgent: window.navigator.userAgent,
  });

  if ("sendBeacon" in navigator) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/observability", blob);
    return;
  }

  void fetch("/api/observability", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  });
}

export function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }

  return {
    name: "UnknownError",
    message: typeof error === "string" ? error : "Erro desconhecido",
    stack: null,
  };
}
