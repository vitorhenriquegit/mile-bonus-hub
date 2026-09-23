import React, { useState } from "react";
import { Play, ExternalLink, Video as VideoIcon, X } from "lucide-react";
import { type HomeVideoBlock } from "@/lib/home-layout";

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}?autoplay=1`
    : null;
}

function getVimeoEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/;
  const match = url.match(regExp);
  return match && match[1] ? `https://player.vimeo.com/video/${match[1]}?autoplay=1` : null;
}

export function HomeVideoPlayer({ video }: { video: HomeVideoBlock }) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!video || !video.enabled || !video.videoUrl) return null;

  const ytEmbed = getYouTubeEmbedUrl(video.videoUrl);
  const vimeoEmbed = getVimeoEmbedUrl(video.videoUrl);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <VideoIcon className="h-3.5 w-3.5 text-primary" />
          Vídeo em Destaque
        </h3>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {isPlaying ? (
          <div className="relative aspect-video w-full bg-black">
            <button
              onClick={() => setIsPlaying(false)}
              className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white hover:bg-black"
              aria-label="Fechar vídeo"
            >
              <X className="h-4 w-4" />
            </button>

            {ytEmbed ? (
              <iframe
                src={ytEmbed}
                title={video.title}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : vimeoEmbed ? (
              <iframe
                src={vimeoEmbed}
                title={video.title}
                className="h-full w-full border-0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={video.videoUrl}
                controls
                autoPlay
                className="h-full w-full object-cover"
              />
            )}
          </div>
        ) : (
          <div
            onClick={() => setIsPlaying(true)}
            className="group relative aspect-video w-full cursor-pointer overflow-hidden bg-muted"
          >
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/20 via-background to-muted">
                <VideoIcon className="h-12 w-12 text-primary opacity-60" />
              </div>
            )}

            <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px] transition group-hover:bg-black/25" />

            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-float transition group-hover:scale-110">
                <Play className="h-6 w-6 ml-0.5 fill-current" />
              </div>
            </div>

            <div className="absolute bottom-3 left-3 right-3 text-white">
              <p className="text-sm font-bold drop-shadow leading-tight line-clamp-1">
                {video.title}
              </p>
              {video.subtitle && (
                <p className="text-[11px] opacity-90 drop-shadow line-clamp-1 mt-0.5">
                  {video.subtitle}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="p-3.5 flex items-center justify-between gap-3 bg-card border-t border-border/60">
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-foreground truncate">{video.title}</h4>
            {video.subtitle && (
              <p className="text-[11px] text-muted-foreground truncate">{video.subtitle}</p>
            )}
          </div>

          {video.ctaLabel && video.ctaUrl && (
            <a
              href={video.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
            >
              {video.ctaLabel}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
