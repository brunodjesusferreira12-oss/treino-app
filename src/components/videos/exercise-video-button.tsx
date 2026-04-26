"use client";

import { useState } from "react";
import { ExternalLink, PlayCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getYouTubeEmbedUrl } from "@/lib/video";

type ExerciseVideoButtonProps = {
  title: string;
  videoUrl: string | null;
};

export function ExerciseVideoButton({
  title,
  videoUrl,
}: ExerciseVideoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!videoUrl) {
    return (
      <span className="inline-flex items-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--muted)]">
        Sem video
      </span>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <>
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        <PlayCircle className="h-4 w-4" />
        Ver execução
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
          <Card className="w-full max-w-4xl space-y-4 border-[color:var(--border)] bg-[color:var(--card-strong)]">
            <div className="flex items-center justify-between gap-4">
              <div>
            <p className="text-sm text-[color:var(--muted)]">Vídeo do exercício</p>
                <h3 className="mt-1 text-xl font-semibold text-[color:var(--foreground)]">
                  {title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground-soft)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-black">
              {embedUrl ? (
                <div className="aspect-video">
                  <iframe
                    src={embedUrl}
                    title={title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center">
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm text-[color:var(--foreground)]"
                  >
                    Abrir video externo
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
