"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const STORAGE_KEY = "fortynex-install-dismissed";

export function InstallAppPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (!promptEvent || isDismissed) {
    return null;
  }

  return (
    <Card className="flex flex-col gap-3 border-lime-300/20 bg-lime-300/10 p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold text-lime-100">Instale o Fortynex</p>
        <p className="mt-1 text-sm text-zinc-200">
          Tenha acesso rápido no celular, com ícone na tela inicial e experiência de app.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            window.localStorage.setItem(STORAGE_KEY, "1");
            setIsDismissed(true);
          }}
        >
          Depois
        </Button>
        <Button
          type="button"
          onClick={async () => {
            await promptEvent.prompt();
            const choice = await promptEvent.userChoice;

            if (choice.outcome === "dismissed") {
              window.localStorage.setItem(STORAGE_KEY, "1");
              setIsDismissed(true);
            }

            setPromptEvent(null);
          }}
        >
          <Download className="h-4 w-4" />
          Instalar app
        </Button>
      </div>
    </Card>
  );
}
