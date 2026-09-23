import React, { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, ExternalLink, Instagram } from "lucide-react";
import { type HomeInstagramBlock } from "@/lib/home-layout";

export function HomeInstagramCard({ instagram }: { instagram: HomeInstagramBlock }) {
  const [liked, setLiked] = useState(false);

  if (!instagram || !instagram.enabled) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Instagram className="h-3.5 w-3.5 text-rose-500" />
          No Instagram
        </h3>
        {instagram.instagramHandle && (
          <a
            href={instagram.postUrl || `https://instagram.com/${instagram.instagramHandle.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
          >
            {instagram.instagramHandle} <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {/* Instagram Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2px]">
              <div className="grid h-full w-full place-items-center rounded-full bg-card text-[11px] font-bold text-foreground">
                <Instagram className="h-4 w-4 text-rose-500" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground leading-tight flex items-center gap-1">
                {instagram.instagramHandle}
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              </p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                {instagram.profileName || "Publicação Oficial"}
              </p>
            </div>
          </div>

          <a
            href={instagram.postUrl || "https://instagram.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-accent px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-accent/80 transition"
          >
            Seguir
          </a>
        </div>

        {/* Post Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {instagram.imageUrl ? (
            <img
              src={instagram.imageUrl}
              alt="Post do Instagram"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-rose-500/20 via-purple-500/20 to-amber-500/20">
              <Instagram className="h-16 w-16 text-rose-500/60" />
            </div>
          )}

          {instagram.postType === "reel" && (
            <span className="absolute top-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
              REELS
            </span>
          )}
        </div>

        {/* Post Actions */}
        <div className="p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLiked(!liked)}
                className="transition hover:scale-110 active:scale-95"
                aria-label="Curtir post"
              >
                <Heart
                  className={`h-5 w-5 ${
                    liked ? "fill-rose-500 text-rose-500" : "text-muted-foreground hover:text-foreground"
                  }`}
                />
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition hover:scale-110"
                aria-label="Comentar"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition hover:scale-110"
                aria-label="Compartilhar"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition"
              aria-label="Salvar"
            >
              <Bookmark className="h-5 w-5" />
            </button>
          </div>

          {instagram.likesCount && (
            <p className="text-xs font-bold text-foreground">
              {liked ? "Você e outras " : ""}{instagram.likesCount} curtidas
            </p>
          )}

          {instagram.caption && (
            <p className="text-xs text-foreground/90 leading-snug line-clamp-2">
              <strong className="font-bold mr-1">{instagram.instagramHandle}</strong>
              {instagram.caption}
            </p>
          )}

          <div className="pt-2 border-t border-border/50 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {instagram.commentsCount ? `Ver todos os ${instagram.commentsCount} comentários` : "Comentários no app"}
            </span>

            <a
              href={instagram.postUrl || "https://instagram.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              {instagram.ctaLabel || "Ver no Instagram"} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
